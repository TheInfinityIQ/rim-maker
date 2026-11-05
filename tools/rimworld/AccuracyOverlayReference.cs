using System;
using System.Collections.Generic;
using System.IO;
using System.Xml.Linq;
using RimWorld;
using UnityEngine;
using Verse;

namespace RimMaker.ShootingPreview
{
    public sealed class OverlayReference : GameComponent
    {
        bool started;
        public OverlayReference(Game game) { }
        public override void GameComponentUpdate()
        {
            string output;
            if (started || !GenCommandLine.TryGetCommandLineArg("rimmaker-overlay-reference", out output) || Current.ProgramState != ProgramState.Playing || LongEventHandler.ShouldWaitForEvent) return;
            started = true;
            try { Run(output); }
            catch (Exception error) { File.WriteAllText(Path.Combine(output, "capture-error.txt"), error.ToString()); Application.Quit(1); }
        }
        void Run(string output)
        {
            Find.TickManager.CurTimeSpeed = TimeSpeed.Paused;
            Map map = Find.CurrentMap;
            WhiteRange.Clear(map, map.Center);
            IntVec3 origin = map.Center + new IntVec3(-50, 0, 0);
            var result = new XElement("reference", new XAttribute("gameVersion", VersionControl.CurrentVersionString));
            foreach (var test in XDocument.Load(Path.Combine(output, "cases.xml")).Root.Elements("case"))
            {
                int skill = (int)test.Attribute("skill");
                string qualityName = (string)test.Attribute("quality"), weatherName = (string)test.Attribute("weather"), coverName = (string)test.Attribute("cover");
                WeatherDef weather = DefDatabase<WeatherDef>.GetNamed(weatherName);
                map.weatherManager.curWeather = map.weatherManager.lastWeather = weather;
                map.weatherManager.curWeatherAge = 5000;
                Pawn shooter = WhiteRange.Shooter(map, origin, skill);
                ThingWithComps gun = (ThingWithComps)ThingMaker.MakeThing(ThingDef.Named("Gun_AssaultRifle"));
                gun.TryGetComp<CompQuality>().SetQuality((QualityCategory)Enum.Parse(typeof(QualityCategory), qualityName), ArtGenerationContext.Colony);
                shooter.equipment.AddEquipment(gun);
                Verb verb = gun.TryGetComp<CompEquippable>().PrimaryVerb;
                Pawn target = WhiteRange.Shooter(map, origin + new IntVec3(1, 0, 0), 10);
                foreach (int distance in new[] { 1, 2, 3, 4, 12, 25 })
                {
                    target.DeSpawn(); GenSpawn.Spawn(target, origin + new IntVec3(distance, 0, 0), map);
                    Thing cover = null;
                    if (!string.IsNullOrEmpty(coverName) && distance > 1)
                    {
                        ThingDef coverDef = ThingDef.Named(coverName);
                        cover = ThingMaker.MakeThing(coverDef, GenStuff.DefaultStuffFor(coverDef));
                        Plant tree = cover as Plant; if (tree != null) tree.Growth = 1;
                        GenSpawn.Spawn(cover, target.Position + new IntVec3(-1, 0, 0), map);
                    }
                    ShotReport report = ShotReport.HitReportFor(shooter, verb, target);
                    result.Add(new XElement("row", new XAttribute("skill", skill), new XAttribute("quality", qualityName), new XAttribute("weather", weatherName), new XAttribute("cover", coverName), new XAttribute("distance", distance),
                        new XAttribute("chance", report.TotalEstimatedHitChance), new XAttribute("passCover", report.PassCoverChance), new XAttribute("bodySize", target.BodySize)));
                    if (cover != null) cover.Destroy(DestroyMode.Vanish);
                }
                target.Destroy(DestroyMode.Vanish); shooter.Destroy(DestroyMode.Vanish);
            }
            new XDocument(result).Save(Path.Combine(output, "reference.xml"));
            Application.Quit(0);
        }
    }
}
