// Captures a composed gameplay scene for the educational range preview.
// Game textures/assemblies are resolved from the local installation, not extracted.
using System;
using System.IO;
using System.Linq;
using System.Text;
using RimWorld;
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
                    if ((Math.Abs(z + 9) < 2 && Math.Abs(x) < 25) || (Math.Abs(x + 22) < 2 && Math.Abs(z) < 26))
                        map.terrainGrid.SetTerrain(cell, DefDatabase<TerrainDef>.GetNamed("Concrete"));
                }
                Pawn pawn = PawnGenerator.GeneratePawn(PawnKindDefOf.Colonist, Faction.OfPlayer);
                GenSpawn.Spawn(pawn, center, map);
                pawn.Rotation = Rot4.East;
                ThingWithComps gun = ThingMaker.MakeThing(ThingDef.Named("Gun_AssaultRifle")) as ThingWithComps;
                pawn.equipment.AddEquipment(gun);
                pawn.drafter.Drafted = true;
                pawn.Drawer.renderer.SetAllGraphicsDirty();
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
            done = true;
            Application.Quit(0);
        }
    }
}
