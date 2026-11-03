// Captures a composed gameplay scene for the educational range preview.
// Resolves the scene and its reference sprites from the local installation.
using System;
using System.IO;
using System.Linq;
using System.Text;
using RimWorld;
using RimWorld.BaseGen;
using UnityEngine;
using Verse;

namespace RimMaker.PreviewCapture
{
    public sealed class CaptureDriver : GameComponent
    {
        private int frames;
        private bool done;
        private string output;
        private Map map;
        private IntVec3 center;
        private IntVec3 sandbag;
        private IntVec3 startingCell;
        private Pawn referencePawn;
        public CaptureDriver(Game game) { }
        public override void GameComponentUpdate()
        {
            if (done || !GenCommandLine.TryGetCommandLineArg("rimmaker-capture", out output) || Current.ProgramState != ProgramState.Playing || LongEventHandler.ShouldWaitForEvent) return;
            try
            {
                if (frames++ == 0) Setup();
                Find.CameraDriver.SetRootPosAndSize(center.ToVector3Shifted(), 112);
                if (frames == 60) Capture();
            }
            catch (Exception error)
            {
                done = true;
                File.WriteAllText(Path.Combine(output, "capture-error.txt"), error.ToString());
                Log.Error(error.ToString());
                Application.Quit(1);
            }
        }
        private void Setup()
        {
            map = Find.CurrentMap;
            center = map.Center;
            Find.TickManager.CurTimeSpeed = TimeSpeed.Paused;
            Find.CameraDriver.config.sizeRange = new FloatRange(1, 120);
            foreach (Pawn pawn in map.mapPawns.AllPawnsSpawned.ToList()) pawn.DeSpawn();
            Rand.PushState(561491);
            try
            {
                foreach (IntVec3 cell in CellRect.CenteredOn(center, 114).Cells)
                {
                    map.roofGrid.SetRoof(cell, null);
                    foreach (Thing thing in cell.GetThingList(map).ToList())
                        if (thing.def.destroyable) thing.Destroy(DestroyMode.Vanish); else thing.DeSpawn();
                    map.terrainGrid.SetTerrain(cell, TerrainDefOf.Soil);
                    int x = cell.x - center.x, z = cell.z - center.z;
                    // Keep the firing lane clear, with naturally scattered grass around it.
                    if (Math.Abs(z) > 3 && Rand.Chance(0.20f))
                    {
                        Plant plant = GenSpawn.Spawn(ThingDef.Named("Plant_Grass"), cell, map) as Plant;
                        plant.Growth = Rand.Range(0.3f, 1f);
                    }
                }
                Faction enemy = Find.FactionManager.FirstFactionOfDef(FactionDefOf.Pirate) ?? Find.FactionManager.RandomEnemyFaction();
                CellRect village = new CellRect(center.x + 25, center.z - 30, 65, 60);
                BaseGen.globalSettings.map = map;
                BaseGen.globalSettings.minBuildings = 6;
                BaseGen.globalSettings.minBarracks = 2;
                BaseGen.symbolStack.Push("settlement", new ResolveParams { rect = village, faction = enemy, settlementDontGeneratePawns = true });
                BaseGen.Generate();
                int outerX = map.listerThings.ThingsOfDef(ThingDef.Named("Sandbags")).Select(t => t.Position.x).DefaultIfEmpty(village.minX).Min() - 3;
                for (int z = center.z - 9; z <= center.z + 9; z++)
                {
                    IntVec3 c = new IntVec3(outerX, 0, z);
                    foreach (Thing thing in c.GetThingList(map).ToList()) if (thing.def.destroyable) thing.Destroy(DestroyMode.Vanish); else thing.DeSpawn();
                    Thing bag = GenSpawn.Spawn(ThingMaker.MakeThing(ThingDef.Named("Sandbags"), ThingDefOf.Cloth), c, map);
                    bag.SetFaction(enemy);
                }
                sandbag = new IntVec3(outerX, 0, center.z);
                startingCell = sandbag + new IntVec3(-100, 0, 0);
                if (!startingCell.Standable(map)) throw new InvalidOperationException("The 100-tile starting position is not clear.");
                referencePawn = PawnGenerator.GeneratePawn(PawnKindDefOf.Colonist, Faction.OfPlayer);
                referencePawn.Rotation = Rot4.East;
                referencePawn.Drawer.renderer.SetAllGraphicsDirty();
                map.fogGrid.ClearAllFog();
                map.mapDrawer.RegenerateEverythingNow();
                // Midday light in the disposable map.
                Find.TickManager.DebugSetTicksGame(Find.TickManager.TicksGame + 30000 - GenLocalDate.DayTick(map));
                map.weatherManager.TransitionTo(WeatherDefOf.Clear);
            }
            finally { Rand.PopState(); }
        }
        private void Capture()
        {
            const int size = 3072;
            Camera camera = Find.Camera;
            RenderTexture render = new RenderTexture(size, size, 24);
            camera.targetTexture = render;
            camera.aspect = 1;
            camera.nearClipPlane = .1f;
            camera.farClipPlane = 500;
            camera.cullingMask = -1;
            camera.orthographic = true;
            camera.transform.position = new Vector3(center.x + .5f, 50, center.z + .5f);
            camera.transform.rotation = Quaternion.Euler(90, 0, 0);
            map.mapDrawer.DrawMapMesh();
            camera.Render();
            RenderTexture.active = render;
            Texture2D texture = new Texture2D(size, size, TextureFormat.RGB24, false);
            texture.ReadPixels(new Rect(0, 0, size, size), 0, 0);
            texture.Apply();
            File.WriteAllBytes(Path.Combine(output, "firing-range.jpg"), texture.EncodeToJPG(90));
            Vector3 origin = camera.WorldToViewportPoint(center.ToVector3Shifted());
            Vector3 next = camera.WorldToViewportPoint((center + IntVec3.East).ToVector3Shifted());
            float pixelsPerTile = (next.x - origin.x) * size;
            string culture = "{\"width\":" + size + ",\"height\":" + size + ",\"pixelsPerTile\":" + pixelsPerTile.ToString(System.Globalization.CultureInfo.InvariantCulture) + ",\"centerX\":" + (origin.x * size).ToString(System.Globalization.CultureInfo.InvariantCulture) + ",\"centerY\":" + ((1 - origin.y) * size).ToString(System.Globalization.CultureInfo.InvariantCulture) + ",\"gameVersion\":\"" + VersionControl.CurrentVersionString + "\"}";
            File.WriteAllText(Path.Combine(output, "firing-range.json"), culture);
            StringBuilder metadata = new StringBuilder(culture.TrimEnd('}'));
            metadata.Append(",\"colonistStart\":{\"x\":" + (startingCell.x - center.x) + ",\"y\":" + (center.z - startingCell.z) + "}");
            metadata.Append(",\"sandbag\":{\"x\":" + (sandbag.x - center.x) + ",\"y\":" + (center.z - sandbag.z) + "},\"startingDistance\":100,\"bounds\":{\"minX\":-110,\"maxX\":110,\"minY\":-110,\"maxY\":110},\"blocked\":[");
            bool firstBlocked = true;
            foreach (IntVec3 cell in CellRect.CenteredOn(center, 110).Cells)
            {
                if (cell.Standable(map)) continue;
                if (!firstBlocked) metadata.Append(","); firstBlocked = false;
                metadata.Append("[" + (cell.x - center.x) + "," + (center.z - cell.z) + "]");
            }
            metadata.Append("]}");
            File.WriteAllText(Path.Combine(output, "firing-range.json"), metadata.ToString());
            StringBuilder reference = new StringBuilder("{\"gameVersion\":\"" + VersionControl.CurrentVersionString + "\",\"radii\":[");
            bool first = true;
            foreach (float radius in new[] { 0f, 1f, 1.4f, 1.5f, 2f, 2.5f, 15.9f, 33.5f, 50f, 79f })
            {
                if (!first) reference.Append(","); first = false;
                reference.Append("{\"radius\":" + radius.ToString(System.Globalization.CultureInfo.InvariantCulture) + ",\"cells\":" + GenRadial.NumCellsInRadius(radius) + "}");
            }
            reference.Append("]}");
            File.WriteAllText(Path.Combine(output, "range-reference.json"), reference.ToString());
            camera.targetTexture = null;
            RenderTexture.active = null;
            UnityEngine.Object.Destroy(texture);
            UnityEngine.Object.Destroy(render);
            CaptureReferenceAssets();
            done = true;
            Application.Quit(0);
        }
        private void SaveTexture(RenderTexture render, string filename)
        {
            RenderTexture.active = render;
            Texture2D image = new Texture2D(render.width, render.height, TextureFormat.RGBA32, false);
            image.ReadPixels(new Rect(0, 0, render.width, render.height), 0, 0);
            image.Apply();
            File.WriteAllBytes(Path.Combine(output, filename), image.EncodeToPNG());
            RenderTexture.active = null;
            UnityEngine.Object.Destroy(image);
        }
        private void CaptureReferenceAssets()
        {
            RenderTexture body = new RenderTexture(256, 256, 24, RenderTextureFormat.ARGB32);
            Find.PawnCacheRenderer.RenderPawn(referencePawn, body, Vector3.zero, .75f, 0, Rot4.East);
            SaveTexture(body, "colonist.png");
            UnityEngine.Object.Destroy(body);
            Texture2D rifle = ContentFinder<Texture2D>.Get("Things/Item/Equipment/WeaponRanged/AssaultRifle");
            RenderTexture weapon = new RenderTexture(rifle.width, rifle.height, 0, RenderTextureFormat.ARGB32);
            Graphics.Blit(rifle, weapon);
            SaveTexture(weapon, "assault-rifle.png");
            UnityEngine.Object.Destroy(weapon);
        }
    }
}
