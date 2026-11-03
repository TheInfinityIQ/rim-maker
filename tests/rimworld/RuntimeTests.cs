// Compiled locally against the user's installed game. No game assemblies are distributed.
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml.Linq;
using System.Reflection;
using System.Globalization;
using RimWorld;
using UnityEngine;
using Verse;
using Verse.AI;
using Verse.Sound;

namespace RimMaker.RuntimeTests
{
    public sealed class TestMod : Mod
    {
        internal static readonly List<string> Errors = new List<string>();
        internal static readonly List<string> Warnings = new List<string>();
        internal static string PlanPath;
        public TestMod(ModContentPack content) : base(content)
        {
            if (!GenCommandLine.CommandLineArgPassed("rimmaker-runtime-test")) return;
            GenCommandLine.TryGetCommandLineArg("rimmaker-test-plan", out PlanPath);
            Application.logMessageReceivedThreaded += Capture;
            Log.Message("[RimMaker runtime] Harness loaded; normal save-data folder is not used.");
        }
        private static void Capture(string message, string stack, LogType type)
        {
            lock (Errors)
            {
                if (type == LogType.Error || type == LogType.Exception || type == LogType.Assert)
                    Errors.Add(message + "\n" + stack);
                else if (type == LogType.Warning) Warnings.Add(message);
            }
        }
    }

    public sealed class RuntimeDriver : GameComponent
    {
        private bool initialized, finished, running;
        private Map map;
        private Pawn shooter;
        private IntVec3 origin;
        private List<XElement> plans;
        private readonly List<XElement> results = new List<XElement>();
        private int index;
        private XElement current;
        private readonly HashSet<int> seenShots = new HashSet<int>();
        private readonly List<int> shotTicks = new List<int>();
        private string phase = "initialization";
        public RuntimeDriver(Game game) { }

        public override void GameComponentUpdate()
        {
            if (finished || running || TestMod.PlanPath == null || Current.ProgramState != ProgramState.Playing || LongEventHandler.ShouldWaitForEvent) return;
            running = true;
            Rand.PushState(194561 + index);
            try
            {
                if (!initialized) Initialize();
                if (index >= plans.Count) { Finish(); return; }
                RunWeapon(plans[index++]);
            }
            catch (Exception ex)
            {
                if (current == null) current = new XElement("case", new XAttribute("weapon", "harness"));
                current.SetAttributeValue("status", "failed");
                current.Add(new XElement("failure", new XAttribute("phase", phase), ex.ToString()));
                if (!results.Contains(current)) results.Add(current);
                SaveProgress();
                if (!initialized) Finish();
            }
            finally { Rand.PopState(); running = false; }
        }

        private void Initialize()
        {
            plans = XDocument.Load(TestMod.PlanPath).Root.Elements("weapon").ToList();
            Require(plans.Count > 0, "No weapon cases in runtime plan.");
            map = Find.CurrentMap;
            Require(map != null, "Quicktest did not create a map.");
            Find.TickManager.CurTimeSpeed = TimeSpeed.Paused;
            origin = map.Center + new IntVec3(-12, 0, 0);
            // Remove quicktest inhabitants and clear a controlled, roofless firing lane.
            foreach (Pawn pawn in map.mapPawns.AllPawnsSpawned.ToList()) pawn.DeSpawn();
            foreach (IntVec3 cell in CellRect.CenteredOn(map.Center, 45).Cells)
            {
                map.roofGrid.SetRoof(cell, null);
                foreach (Thing thing in cell.GetThingList(map).ToList())
                    if (thing.def.destroyable) thing.Destroy(DestroyMode.Vanish); else thing.DeSpawn();
                map.terrainGrid.SetTerrain(cell, TerrainDefOf.Soil);
            }
            initialized = true;
            Log.Message("[RimMaker runtime] Starting " + plans.Count + " weapons on a real quicktest map.");
        }

        private void RunWeapon(XElement plan)
        {
            string name = (string)plan.Attribute("label");
            current = new XElement("case", new XAttribute("weapon", name), new XAttribute("defName", (string)plan.Attribute("defName")));
            results.Add(current);
            int errorsBefore;
            lock (TestMod.Errors) errorsBefore = TestMod.Errors.Count;
            phase = "definition loading";
            CleanupLane();
            if (shooter != null && !shooter.Destroyed) shooter.Destroy(DestroyMode.Vanish);
            shooter = PawnGenerator.GeneratePawn(PawnKindDefOf.Colonist, Faction.OfPlayer);
            // A random nonviolent backstory disables the shooting stat. Use a combat-capable actor.
            for (int retry = 0; shooter.WorkTagIsDisabled(WorkTags.Violent) && retry < 30; retry++)
            {
                shooter.Destroy(DestroyMode.Vanish);
                shooter = PawnGenerator.GeneratePawn(PawnKindDefOf.Colonist, Faction.OfPlayer);
            }
            Require(!shooter.WorkTagIsDisabled(WorkTags.Violent), "Could not generate a combat-capable test pawn.");
            GenSpawn.Spawn(shooter, origin, map);
            foreach (SkillRecord skill in shooter.skills.skills) skill.Level = 20;
            shooter.drafter.Drafted = true;
            ThingDef def = DefDatabase<ThingDef>.GetNamed((string)plan.Attribute("defName"));
            Require(def != null, "Weapon definition is not loaded; check active test mods.");
            Require(def.label == name, "Weapon label differs from the test plan.");
            Require(def.Verbs != null && def.Verbs.Count > 0, "Weapon has no verbs.");
            ThingDef projectileDef = def.Verbs[0].defaultProjectile;
            Require(projectileDef != null && projectileDef.projectile != null, "Unresolved projectile definition.");
            Require(projectileDef.thingClass.Name == (string)plan.Attribute("projectileClass"), "Wrong resolved projectile class.");
            Require(def.Verbs[0].burstShotCount == (int)plan.Attribute("burst"), "Wrong resolved burst size.");
            foreach (XElement property in plan.Elements("projectileProperty"))
            {
                string fieldName = (string)property.Attribute("name");
                FieldInfo field = typeof(ProjectileProperties).GetField(fieldName, BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
                Require(field != null, "Unknown projectile property: " + fieldName);
                object actual = field.GetValue(projectileDef.projectile);
                string expected = (string)property.Attribute("value");
                string actualText = actual is Def ? ((Def)actual).defName : Convert.ToString(actual, CultureInfo.InvariantCulture);
                double expectedNumber, actualNumber;
                bool equal = double.TryParse(expected, NumberStyles.Float, CultureInfo.InvariantCulture, out expectedNumber) && double.TryParse(actualText, NumberStyles.Float, CultureInfo.InvariantCulture, out actualNumber)
                    ? Math.Abs(expectedNumber - actualNumber) < 0.0001 : string.Equals(expected, actualText, StringComparison.OrdinalIgnoreCase);
                Require(equal, "Resolved projectile " + fieldName + ": expected " + expected + ", got " + actualText);
            }
            Check("definitions");

            phase = "crafting products";
            RecipeDef recipe = DefDatabase<RecipeDef>.AllDefs.FirstOrDefault(r => r.products != null && r.products.Any(p => p.thingDef == def));
            Require(recipe != null, "No crafting recipe produces this weapon.");
            Require(recipe.recipeUsers != null && recipe.recipeUsers.Count > 0, "Recipe has no workbench.");
            Building_WorkTable table = ThingMaker.MakeThing(recipe.recipeUsers[0]) as Building_WorkTable;
            Require(table != null, "Recipe user is not a worktable.");
            GenSpawn.Spawn(table, origin + new IntVec3(-5, 0, -5), map);
            List<Thing> ingredients = new List<Thing>();
            foreach (ThingDefCountClass cost in def.costList ?? new List<ThingDefCountClass>())
            {
                Thing ingredient = ThingMaker.MakeThing(cost.thingDef);
                ingredient.stackCount = cost.count;
                ingredients.Add(ingredient);
            }
            List<Thing> products = GenRecipe.MakeRecipeProducts(recipe, shooter, ingredients, ingredients.FirstOrDefault(), table).ToList();
            ThingWithComps gun = products.FirstOrDefault(p => p.def == def) as ThingWithComps;
            Require(gun != null, "Crafting did not create the weapon.");
            table.Destroy(DestroyMode.Vanish);
            Check("crafting-product-generation");

            phase = "equipping and assets";
            shooter.equipment.DestroyAllEquipment();
            shooter.equipment.AddEquipment(gun);
            Require(shooter.equipment.Primary == gun, "Weapon did not equip.");
            Require(gun.Graphic.MatSingle != null && gun.Graphic.MatSingle.mainTexture != BaseContent.BadTex, "Weapon texture failed to load.");
            Thing projectileGraphic = ThingMaker.MakeThing(projectileDef);
            Require(projectileGraphic.Graphic.MatSingle != null && projectileGraphic.Graphic.MatSingle.mainTexture != BaseContent.BadTex, "Projectile texture failed to load.");
            projectileGraphic.Destroy(DestroyMode.Vanish);
            foreach (SoundDef sound in new[] { def.soundInteract, def.Verbs[0].soundCast, def.Verbs[0].soundCastTail }.Where(s => s != null))
                sound.PlayOneShot(SoundInfo.InMap(shooter));
            Check("equip-textures-sound-playback");

            phase = "ranged warmup and burst";
            Thing target = Target(origin + new IntVec3(16, 0, 0));
            Verb verb = shooter.equipment.PrimaryEq.PrimaryVerb;
            Require(verb != null, "No primary firing verb.");
            ResetPawn();
            seenShots.Clear(); shotTicks.Clear();
            int castStarted = Find.TickManager.TicksGame;
            int expectedWarmup = (verb.WarmupTime * shooter.GetStatValue(StatDefOf.AimingDelayFactor)).SecondsToTicks();
            Require(verb.TryStartCastOn(target), "Weapon refused a target within range.");
            for (int tick = 0; tick < 2400; tick++)
            {
                ObserveShots();
                Find.TickManager.DoSingleTick();
                ObserveShots();
                if (seenShots.Count >= verb.BurstShotCount && !verb.Bursting && !ActiveProjectiles().Any()) break;
            }
            Require(seenShots.Count == verb.BurstShotCount, "Expected " + verb.BurstShotCount + " shots; observed " + seenShots.Count + ".");
            Require(!verb.Bursting && !ActiveProjectiles().Any(), "Burst/projectiles did not finish.");
            Require(Math.Abs((shotTicks[0] - castStarted) - expectedWarmup) <= 2, "Observed warmup did not match the adjusted weapon warmup.");
            for (int shot = 1; shot < shotTicks.Count; shot++)
                Require(Math.Abs((shotTicks[shot] - shotTicks[shot - 1]) - verb.verbProps.ticksBetweenBurstShots) <= 1, "Observed burst spacing did not match the configured ticks.");
            current.Add(new XElement("burst", new XAttribute("expected", verb.BurstShotCount), new XAttribute("observed", seenShots.Count), new XAttribute("warmupTicks", shotTicks[0] - castStarted), new XAttribute("shotTicks", string.Join(",", shotTicks))));
            Check("warmup-burst-projectile-lifecycle");

            phase = "cooldown and refire";
            int cooldown = verb.verbProps.AdjustedCooldownTicks(verb, shooter);
            for (int tick = 0; tick < cooldown + 5; tick++) Find.TickManager.DoSingleTick();
            Require(!shooter.stances.FullBodyBusy, "Pawn remained busy after the firing cooldown.");
            seenShots.Clear(); shotTicks.Clear();
            Require(verb.TryStartCastOn(target), "Weapon could not fire again after cooldown.");
            for (int tick = 0; tick < 2400; tick++)
            {
                ObserveShots(); Find.TickManager.DoSingleTick(); ObserveShots();
                if (seenShots.Count >= verb.BurstShotCount && !verb.Bursting && !ActiveProjectiles().Any()) break;
            }
            Require(seenShots.Count == verb.BurstShotCount && !verb.Bursting && !ActiveProjectiles().Any(), "Second burst did not complete.");
            Check("cooldown-and-refire");

            phase = "controlled projectile impact";
            CleanupEffects();
            target.HitPoints = target.MaxHitPoints;
            Thing adjacent = Target(target.Position + new IntVec3(0, 0, 1));
            int hp = target.HitPoints, adjacentHp = adjacent.HitPoints;
            Projectile projectile = GenSpawn.Spawn(projectileDef, origin, map) as Projectile;
            Require(projectile != null, "Projectile class could not be instantiated.");
            projectile.Launch(shooter, origin.ToVector3Shifted(), target, target, ProjectileHitFlags.IntendedTarget, false, gun);
            for (int tick = 0; tick < 1200 && !projectile.Destroyed; tick++) Find.TickManager.DoSingleTick();
            // Explosions spread their damage across subsequent ticks.
            for (int tick = 0; tick < 120; tick++) Find.TickManager.DoSingleTick();
            Require(projectile.Destroyed, "Projectile never completed impact.");
            Require(target.HitPoints < hp, "Projectile caused no damage to a flammable, unarmoured target.");
            if (projectileDef.projectile.explosionRadius >= 1.5f)
                Require(adjacent.HitPoints < adjacentHp, "Explosion did not damage the adjacent target.");
            else Require(adjacent.HitPoints == adjacentHp, "Direct projectile unexpectedly damaged an adjacent target.");
            current.Add(new XElement("impact", new XAttribute("damageDef", projectileDef.projectile.damageDef.defName), new XAttribute("directDamage", hp - target.HitPoints), new XAttribute("adjacentDamage", adjacentHp - adjacent.HitPoints), new XAttribute("radius", projectileDef.projectile.explosionRadius), new XAttribute("firesObserved", map.listerThings.ThingsOfDef(ThingDefOf.Fire).Count), new XAttribute("preExplosionSpawn", projectileDef.projectile.preExplosionSpawnThingDef == null ? "none" : projectileDef.projectile.preExplosionSpawnThingDef.defName)));
            Check("impact-damage-and-area-behavior");
            if (projectileDef.projectile.damageDef == DamageDefOf.Flame)
            {
                phase = "incendiary fire effects";
                int attempts = 1;
                while (map.listerThings.ThingsOfDef(ThingDefOf.Fire).Count == 0 && attempts < 16)
                {
                    Projectile flame = GenSpawn.Spawn(projectileDef, origin, map) as Projectile;
                    flame.Launch(shooter, origin.ToVector3Shifted(), target, target, ProjectileHitFlags.IntendedTarget, false, gun);
                    for (int tick = 0; tick < 300; tick++) Find.TickManager.DoSingleTick();
                    attempts++;
                }
                Require(map.listerThings.ThingsOfDef(ThingDefOf.Fire).Count > 0, "Incendiary impacts never started a fire on flammable targets.");
                current.Add(new XElement("incendiary", new XAttribute("impacts", attempts), new XAttribute("firesObserved", map.listerThings.ThingsOfDef(ThingDefOf.Fire).Count)));
                Check("incendiary-fire-creation");
            }

            phase = "weapon melee tools";
            CleanupEffects();
            Thing meleeTarget = Target(origin + new IntVec3(1, 0, 0));
            List<Verb> melee = gun.GetComp<CompEquippable>().AllVerbs.Where(v => v.IsMeleeAttack).ToList();
            Require(melee.Count > 0, "No melee tool verbs resolved.");
            foreach (Verb attack in melee)
            {
                int before = meleeTarget.HitPoints;
                for (int attempt = 0; attempt < 12 && meleeTarget.HitPoints == before; attempt++)
                {
                    ResetPawn();
                    Require(attack.TryStartCastOn(meleeTarget), "A melee tool refused an adjacent target.");
                    for (int tick = 0; tick < 180; tick++) Find.TickManager.DoSingleTick();
                }
                Require(meleeTarget.HitPoints < before, "A melee tool never inflicted damage.");
            }
            current.Add(new XElement("melee", new XAttribute("verbsExercised", melee.Count)));
            Check("all-resolved-melee-verbs");

            phase = "dropping equipment";
            ThingWithComps dropped;
            Require(shooter.equipment.TryDropEquipment(gun, out dropped, origin + new IntVec3(-2, 0, 0), false), "Could not drop the weapon.");
            Require(dropped.Spawned && shooter.equipment.Primary == null, "Dropped weapon has an invalid ownership state.");
            dropped.Destroy(DestroyMode.Vanish);
            Check("drop-equipment");
            lock (TestMod.Errors) Require(TestMod.Errors.Count == errorsBefore, "Game logged an error while exercising this weapon.");
            current.SetAttributeValue("status", "passed");
            Log.Message("[RimMaker runtime] PASS " + name);
            SaveProgress();
        }

        private void ResetPawn()
        {
            shooter.drafter.Drafted = true;
            if (shooter.needs.food != null) shooter.needs.food.CurLevelPercentage = 1;
            if (shooter.needs.rest != null) shooter.needs.rest.CurLevelPercentage = 1;
            shooter.stances.CancelBusyStanceSoft();
            shooter.jobs.StartJob(JobMaker.MakeJob(JobDefOf.Wait_Combat), JobCondition.InterruptForced);
            shooter.Position = origin;
        }
        private Thing Target(IntVec3 cell)
        {
            foreach (Thing thing in cell.GetThingList(map).ToList()) if (thing != shooter) thing.Destroy(DestroyMode.Vanish);
            return GenSpawn.Spawn(DefDatabase<ThingDef>.GetNamed("RimMaker_RuntimeTarget"), cell, map);
        }
        private IEnumerable<Projectile> ActiveProjectiles()
        {
            return map.listerThings.ThingsInGroup(ThingRequestGroup.Projectile).OfType<Projectile>().Where(p => p.Launcher == shooter);
        }
        private void ObserveShots()
        {
            foreach (Projectile p in ActiveProjectiles()) if (seenShots.Add(p.thingIDNumber)) shotTicks.Add(Find.TickManager.TicksGame);
        }
        private void CleanupEffects()
        {
            foreach (Thing thing in map.listerThings.AllThings.ToList())
                if (thing is Projectile || thing is Fire || thing is Explosion || thing.def == ThingDefOf.Chemfuel)
                    thing.Destroy(DestroyMode.Vanish);
        }
        private void CleanupLane()
        {
            CleanupEffects();
            foreach (Thing thing in map.listerThings.AllThings.ToList())
                if (thing.def.defName == "RimMaker_RuntimeTarget") thing.Destroy(DestroyMode.Vanish);
        }
        private void Check(string name) { current.Add(new XElement("check", new XAttribute("name", name), new XAttribute("status", "passed"))); }
        private static void Require(bool condition, string message) { if (!condition) throw new InvalidOperationException(message); }
        private void SaveProgress()
        {
            XElement root = new XElement("runtimeTests", new XAttribute("gameVersion", VersionControl.CurrentVersionString), new XAttribute("expected", plans == null ? 0 : plans.Count), new XAttribute("completed", results.Count), results.Select(r => new XElement(r)));
            root.Add(new XElement("activeMods", LoadedModManager.RunningModsListForReading.Select(mod => new XElement("package", mod.PackageId))));
            lock (TestMod.Errors)
            {
                root.Add(new XElement("errors", TestMod.Errors.Select(error => new XElement("error", error))));
                root.Add(new XElement("warnings", TestMod.Warnings.Select(warning => new XElement("warning", warning))));
            }
            new XDocument(root).Save(Path.Combine(Path.GetDirectoryName(TestMod.PlanPath), "runtime-results.xml"));
        }
        private void Finish()
        {
            finished = true;
            SaveProgress();
            int failures = results.Count(r => (string)r.Attribute("status") != "passed");
            lock (TestMod.Errors) failures += TestMod.Errors.Count;
            Log.Message("[RimMaker runtime] COMPLETE: " + results.Count + " cases; failures/errors=" + failures);
            Application.Quit(failures == 0 && results.Count == plans.Count ? 0 : 1);
        }
    }
}

