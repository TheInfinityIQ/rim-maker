// Runs and records the installed game. This source contains no replacement combat simulation.
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml.Linq;
using RimWorld;
using RimWorld.BaseGen;
using RimWorld.Planet;
using UnityEngine;
using Verse;
using Verse.AI;

namespace RimMaker.ShootingPreview
{
    public sealed class PreviewMod : Mod
    {
        internal static string Output;
        internal static readonly List<string> Errors = new List<string>();
        public PreviewMod(ModContentPack content) : base(content)
        {
            if (!GenCommandLine.TryGetCommandLineArg("rimmaker-shooting", out Output)) return;
            Application.logMessageReceivedThreaded += delegate(string message, string stack, LogType type) {
                if (type == LogType.Error || type == LogType.Exception || type == LogType.Assert)
                    lock (Errors) Errors.Add(message + "\n" + stack);
            };
        }
    }

    public sealed class Driver : GameComponent
    {
        private bool started;
        public Driver(Game game) { }
        public override void GameComponentUpdate()
        {
            if (PreviewMod.Output == null || Current.ProgramState != ProgramState.Playing || LongEventHandler.ShouldWaitForEvent) return;
            if ((string)XDocument.Load(Path.Combine(PreviewMod.Output, "plan.xml")).Root.Attribute("task") == "accuracy") return;
            Find.TickManager.CurTimeSpeed = TimeSpeed.Paused;
            if (started) return;
            started = true;
            GameObject runner = new GameObject("RimMaker native shooting recorder");
            runner.AddComponent<Recorder>().Begin();
        }
    }

    public sealed class Recorder : MonoBehaviour
    {
        private Map map;
        private Pawn shooter;
        private Verb verb;
        private Camera camera;
        private RenderTexture render;
        private Vector3 cameraCenter;
        private float cameraSize;
        private int tick;
        private XElement report;
        private readonly HashSet<int> seen = new HashSet<int>();
        private readonly List<XElement> frames = new List<XElement>();
        private readonly List<XElement> shots = new List<XElement>();
        private readonly List<XElement> samples = new List<XElement>();
        private int preparation = 60, settledAt = -1;
        private bool finished;
        private bool recording;
        private int firstGameTick;
        private LocalTargetInfo targetInfo;
        private string output { get { return PreviewMod.Output; } }
        public void Begin()
        {
            try { Setup(); } catch (Exception error) { Fail(error); }
        }
        private IntVec3 Cell(XElement plan, string name, IntVec3 center)
        {
            return center + new IntVec3((int)plan.Attribute(name + "X"), 0, -(int)plan.Attribute(name + "Y"));
        }
        private void Setup()
        {
            XElement plan = XDocument.Load(Path.Combine(output, "plan.xml")).Root;
            bool whiteRoom = (string)plan.Attribute("scenario") == "white-room";
            map = Find.CurrentMap;
            // Hidden/offscreen runs can skip OnGUI, which normally initializes these.
            // CameraDriver uses them for visibility culling and projectile tick intervals.
            UI.screenWidth = 640; UI.screenHeight = 640;
            IntVec3 center = map.Center;
            foreach (Pawn pawn in map.mapPawns.AllPawnsSpawned.ToList()) pawn.DeSpawn();
            Rand.PushState(561491);
            try
            {
                foreach (IntVec3 cell in CellRect.CenteredOn(center, 114).Cells)
                {
                    map.roofGrid.SetRoof(cell, null);
                    foreach (Thing thing in cell.GetThingList(map).ToList())
                        if (thing.def.destroyable) thing.Destroy(DestroyMode.Vanish); else thing.DeSpawn();
                    map.terrainGrid.SetTerrain(cell, whiteRoom ? TerrainDef.Named("SterileTile") : TerrainDefOf.Soil);
                    if (!whiteRoom && Math.Abs(cell.z - center.z) > 3 && Rand.Chance(.2f))
                    {
                        Plant grass = GenSpawn.Spawn(ThingDef.Named("Plant_Grass"), cell, map) as Plant;
                        grass.Growth = Rand.Range(.3f, 1f);
                    }
                }
                if (!whiteRoom) {
                Faction enemy = Find.FactionManager.FirstFactionOfDef(FactionDefOf.Pirate) ?? Find.FactionManager.RandomEnemyFaction();
                BaseGen.globalSettings.map = map;
                BaseGen.globalSettings.minBuildings = 6;
                BaseGen.globalSettings.minBarracks = 2;
                BaseGen.symbolStack.Push("settlement", new ResolveParams { rect = new CellRect(center.x + 25, center.z - 30, 65, 60), faction = enemy, settlementDontGeneratePawns = true });
                BaseGen.Generate();
                // Match the reference defensive line; the village itself is a fresh native generation.
                for (int z = -9; z <= 9; z++)
                {
                    IntVec3 cell = center + new IntVec3(22, 0, z);
                    foreach (Thing thing in cell.GetThingList(map).ToList())
                        if (thing.def.destroyable) thing.Destroy(DestroyMode.Vanish); else thing.DeSpawn();
                    GenSpawn.Spawn(ThingMaker.MakeThing(ThingDef.Named("Sandbags"), ThingDefOf.Cloth), cell, map).SetFaction(enemy);
                }
                }
                IntVec3 origin = Cell(plan, "colonist", center), aim = Cell(plan, "target", center);
                if (!origin.Standable(map)) throw new InvalidOperationException("The colonist's tile is blocked in the generated village. Choose open ground.");
                for (int attempt = 0; attempt < 30; attempt++)
                {
                    shooter = PawnGenerator.GeneratePawn(PawnKindDefOf.Colonist, Faction.OfPlayer);
                    if (!shooter.WorkTagIsDisabled(WorkTags.Violent)) break;
                    shooter.Destroy(DestroyMode.Vanish);
                }
                if (shooter.WorkTagIsDisabled(WorkTags.Violent)) throw new InvalidOperationException("Could not generate a combat-capable preview colonist.");
                GenSpawn.Spawn(shooter, origin, map);
                if (whiteRoom) WhiteRange.Standardize(shooter, (int?)plan.Attribute("skill") ?? 10);
                shooter.skills.GetSkill(SkillDefOf.Shooting).Level = (int?)plan.Attribute("skill") ?? 10;
                if (shooter.needs.food != null) shooter.needs.food.CurLevelPercentage = 1;
                if (shooter.needs.rest != null) shooter.needs.rest.CurLevelPercentage = 1;
                shooter.drafter.Drafted = true;
                shooter.drafter.FireAtWill = false;
                ThingDef gunDef = DefDatabase<ThingDef>.GetNamed((string)plan.Attribute("weapon"));
                ThingWithComps gun = ThingMaker.MakeThing(gunDef) as ThingWithComps;
                CompQuality quality = gun.TryGetComp<CompQuality>();
                if (quality != null) quality.SetQuality(QualityCategory.Normal, ArtGenerationContext.Colony);
                shooter.equipment.DestroyAllEquipment();
                shooter.equipment.AddEquipment(gun);
                if (shooter.equipment.Primary != gun) throw new InvalidOperationException("The edited weapon could not be equipped.");
                shooter.jobs.StopAll();
                shooter.jobs.StartJob(JobMaker.MakeJob(JobDefOf.Wait_Combat), JobCondition.InterruptForced);
                shooter.stances.CancelBusyStanceSoft();
                verb = gun.TryGetComp<CompEquippable>().PrimaryVerb;
                // Shoot an actual thing when present, otherwise the actual selected ground cell.
                Thing target = aim.GetThingList(map).FirstOrDefault(t => t.def.category == ThingCategory.Building);
                if (whiteRoom) target = GenSpawn.Spawn(ThingDef.Named("RimMaker_RangeTarget"), aim, map);
                targetInfo = target == null ? new LocalTargetInfo(aim) : new LocalTargetInfo(target);
                if (!verb.CanHitTarget(targetInfo)) throw new InvalidOperationException("RimWorld rejected this target (range, minimum range, roof, or line of sight). Move the colonist or aim at another tile.");
                cameraCenter = (origin.ToVector3Shifted() + aim.ToVector3Shifted()) / 2;
                cameraSize = Mathf.Clamp(Mathf.Max(Mathf.Abs(origin.x - aim.x), Mathf.Abs(origin.z - aim.z)) / 2 + 6, 8, 110);
                Find.CameraDriver.config.sizeRange = new FloatRange(1, 120);
                Find.CameraDriver.SetRootPosAndSize(cameraCenter, cameraSize);
                map.fogGrid.ClearAllFog();
                map.mapDrawer.RegenerateEverythingNow();
                Find.TickManager.DebugSetTicksGame(Find.TickManager.TicksGame + 30000 - GenLocalDate.DayTick(map));
                map.weatherManager.TransitionTo(WeatherDefOf.Clear);
                camera = Find.Camera;
                render = new RenderTexture(640, 640, 24);
                // Audio is auditioned separately in the browser; recordings are explicitly silent.
                AudioListener.volume = 0;
                report = new XElement("replay", new XAttribute("gameVersion", VersionControl.CurrentVersionString),
                    new XAttribute("weapon", gunDef.defName), new XAttribute("projectile", verb.verbProps.defaultProjectile.defName),
                    new XAttribute("projectileClass", verb.verbProps.defaultProjectile.thingClass.FullName),
                    new XAttribute("shootingSkill", (int?)plan.Attribute("skill") ?? 10), new XAttribute("quality", "Normal"),
                    new XAttribute("aimingDelayFactor", shooter.GetStatValue(StatDefOf.AimingDelayFactor)),
                    new XAttribute("warmupTicks", (verb.WarmupTime * shooter.GetStatValue(StatDefOf.AimingDelayFactor)).SecondsToTicks()),
                    new XAttribute("cooldownTicks", verb.verbProps.AdjustedCooldownTicks(verb, shooter)),
                    new XAttribute("target", target == null ? "Ground" : target.def.defName));
            }
            finally { Rand.PopState(); }
        }
        private void LateUpdate()
        {
            if (camera == null) return;
            camera.orthographic = true; camera.orthographicSize = cameraSize; camera.aspect = 1;
            camera.nearClipPlane = .1f; camera.farClipPlane = 500; camera.cullingMask = -1;
            camera.transform.position = new Vector3(cameraCenter.x, 50, cameraCenter.z);
            camera.transform.rotation = Quaternion.Euler(90, 0, 0);
        }
        private List<Projectile> Projectiles() { return map.listerThings.AllThings.OfType<Projectile>().Where(p => p.Launcher == shooter).ToList(); }
        private void Observe()
        {
            tick = Find.TickManager.TicksGame - firstGameTick;
            foreach (Projectile projectile in Projectiles())
            {
                if (projectile.def != verb.verbProps.defaultProjectile) throw new InvalidOperationException("The shooter launched an unexpected projectile.");
                if (seen.Add(projectile.thingIDNumber)) shots.Add(new XElement("shot", new XAttribute("tick", tick), new XAttribute("id", projectile.thingIDNumber)));
                Vector3 pos = projectile.ExactPosition;
                samples.Add(new XElement("sample", new XAttribute("tick", tick), new XAttribute("id", projectile.thingIDNumber),
                    new XAttribute("x", pos.x), new XAttribute("z", pos.z)));
            }
        }
        private void Snapshot()
        {
            // A batch-mode camera is not guaranteed to render automatically.
            UI.screenWidth = 640; UI.screenHeight = 640;
            Find.CameraDriver.SetRootPosAndSize(cameraCenter, cameraSize);
            LateUpdate();
            camera.targetTexture = render;
            GlobalRendererUtility.UpdateGlobalShadersParams();
            map.mapDrawer.DrawMapMesh();
            map.dynamicDrawManager.DrawDynamicThings();
            map.flecks.FleckManagerDraw();
            camera.Render();
            if (tick == 0) File.WriteAllText(Path.Combine(output, "camera.txt"), "pos=" + camera.transform.position + " view=" + Find.CameraDriver.CurrentViewRect + " size=" + camera.orthographicSize + " target=" + camera.targetTexture + " fog=" + map.fogGrid.IsFogged(shooter.Position) + " sky=" + map.skyManager.CurSkyGlow + " enabled=" + camera.enabled + "\n" + string.Join("\n", Camera.allCameras.Select(c => c.name + " depth=" + c.depth + " clear=" + c.clearFlags).ToArray()));
            RenderTexture.active = render;
            Texture2D image = new Texture2D(640, 640, TextureFormat.RGB24, false);
            image.ReadPixels(new Rect(0, 0, 640, 640), 0, 0); image.Apply();
            string file = "frame-" + tick.ToString("D4") + ".jpg";
            File.WriteAllBytes(Path.Combine(output, file), image.EncodeToJPG(72));
            UnityEngine.Object.Destroy(image); RenderTexture.active = null;
            camera.targetTexture = null;
            frames.Add(new XElement("frame", new XAttribute("tick", tick), new XAttribute("file", file)));
        }
        private void Update()
        {
            if (finished) return;
            Find.TickManager.CurTimeSpeed = TimeSpeed.Paused;
            if (preparation-- > 0) return;
            try
            {
                if (!recording)
                {
                    recording = true; firstGameTick = Find.TickManager.TicksGame;
                    Job attack = JobMaker.MakeJob(JobDefOf.AttackStatic, targetInfo);
                    attack.maxNumStaticAttacks = 1;
                    // Suppress the game's automatic queue of attacks on adjacent identical buildings.
                    attack.playerInterruptedForced = true;
                    shooter.jobs.StartJob(attack, JobCondition.InterruptForced);
                }
                tick = Find.TickManager.TicksGame - firstGameTick;
                Snapshot(); Observe();
                if (seen.Count > 0 && !verb.Bursting && !shooter.stances.FullBodyBusy && Projectiles().Count == 0)
                { if (settledAt < 0) settledAt = tick; }
                else settledAt = -1;
                if (tick >= 1800 || (settledAt >= 0 && tick - settledAt >= 180)) { Finish(); return; }
                for (int i = 0; i < 2; i++) { Find.TickManager.DoSingleTick(); Observe(); }
            }
            catch (Exception error) { Fail(error); }
        }
        private void Finish()
        {
            finished = true;
            report.Add(new XAttribute("durationTicks", tick), new XAttribute("complete", tick < 1800),
                new XAttribute("fires", map.listerThings.ThingsOfDef(ThingDefOf.Fire).Count),
                new XAttribute("projectilesObserved", seen.Count), new XElement("frames", frames),
                new XElement("shots", shots), new XElement("samples", samples), new XElement("errors", PreviewMod.Errors.Select(e => new XElement("error", e))));
            new XDocument(report).Save(Path.Combine(output, "replay.xml"));
            camera.targetTexture = null;
            Application.Quit(PreviewMod.Errors.Count == 0 ? 0 : 1);
        }
        private void Fail(Exception error)
        {
            finished = true;
            File.WriteAllText(Path.Combine(output, "shooting-error.txt"), error.ToString());
            Application.Quit(1);
        }
    }
}
