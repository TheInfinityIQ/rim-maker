// Independent per-projectile trials in the actual game, not a browser combat simulator.
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Xml.Linq;
using RimWorld;
using UnityEngine;
using Verse;
using Verse.AI;

namespace RimMaker.ShootingPreview
{
    public sealed class RangeHitCounter : ThingComp
    {
        internal static Pawn Shooter;
        internal static bool Hit;
        public override void PostPreApplyDamage(ref DamageInfo dinfo, out bool absorbed)
        {
            absorbed = false;
            if (dinfo.Instigator == Shooter) Hit = true;
        }
    }

    public static class WhiteRange
    {
        internal static void Clear(Map map, IntVec3 center)
        {
            foreach (Pawn pawn in map.mapPawns.AllPawnsSpawned.ToList()) pawn.DeSpawn();
            foreach (IntVec3 cell in CellRect.CenteredOn(center, 114).Cells)
            {
                map.roofGrid.SetRoof(cell, null);
                foreach (Thing thing in cell.GetThingList(map).ToList())
                    if (thing.def.destroyable) thing.Destroy(DestroyMode.Vanish); else thing.DeSpawn();
                map.terrainGrid.SetTerrain(cell, TerrainDef.Named("SterileTile"));
            }
            map.weatherManager.TransitionTo(WeatherDefOf.Clear);
            map.fogGrid.ClearAllFog();
            Find.TickManager.DebugSetTicksGame(Find.TickManager.TicksGame + 30000 - GenLocalDate.DayTick(map));
        }
        internal static Pawn Shooter(Map map, IntVec3 origin, int skill)
        {
            Pawn pawn = null;
            for (int attempt = 0; attempt < 30; attempt++)
            {
                pawn = PawnGenerator.GeneratePawn(PawnKindDefOf.Colonist, Faction.OfPlayer);
                if (!pawn.WorkTagIsDisabled(WorkTags.Violent)) break;
                pawn.Destroy(DestroyMode.Vanish);
            }
            if (pawn == null || pawn.Destroyed) throw new InvalidOperationException("Could not create a range shooter.");
            GenSpawn.Spawn(pawn, origin, map);
            Standardize(pawn, skill);
            return pawn;
        }
        internal static void Standardize(Pawn pawn, int skill)
        {
            pawn.ageTracker.AgeBiologicalTicks = 25L * GenDate.TicksPerYear;
            foreach (Hediff hediff in pawn.health.hediffSet.hediffs.ToList()) pawn.health.RemoveHediff(hediff);
            pawn.story.traits.allTraits.Clear();
            if (ModsConfig.BiotechActive && pawn.genes != null) pawn.genes.SetXenotype(XenotypeDefOf.Baseliner);
            pawn.apparel.DestroyAll();
            pawn.equipment.DestroyAllEquipment();
            pawn.skills.GetSkill(SkillDefOf.Shooting).Level = skill;
            if (pawn.needs.food != null) pawn.needs.food.CurLevelPercentage = 1;
            if (pawn.needs.rest != null) pawn.needs.rest.CurLevelPercentage = 1;
            pawn.drafter.Drafted = true; pawn.drafter.FireAtWill = false;
        }
    }

    public sealed class AccuracyDriver : GameComponent
    {
        private bool started;
        public AccuracyDriver(Game game) { }
        public override void GameComponentUpdate()
        {
            if (started || PreviewMod.Output == null || Current.ProgramState != ProgramState.Playing || LongEventHandler.ShouldWaitForEvent) return;
            XElement plan = XDocument.Load(Path.Combine(PreviewMod.Output, "plan.xml")).Root;
            if ((string)plan.Attribute("task") != "accuracy") return;
            started = true; Find.TickManager.CurTimeSpeed = TimeSpeed.Paused;
            try { Run(plan); }
            catch (Exception error) { File.WriteAllText(Path.Combine(PreviewMod.Output, "shooting-error.txt"), error.ToString()); Application.Quit(1); }
        }
        private void Run(XElement plan)
        {
            Map map = Find.CurrentMap;
            UI.screenWidth = UI.screenHeight = 640;
            WhiteRange.Clear(map, map.Center);
            IntVec3 origin = map.Center + new IntVec3(-100, 0, 0);
            Rand.PushState(981637);
            try
            {
                int skill = (int?)plan.Attribute("skill") ?? 10, trials = (int?)plan.Attribute("trials") ?? 200;
                Pawn shooter = WhiteRange.Shooter(map, origin, skill);
                RangeHitCounter.Shooter = shooter;
                ThingDef gunDef = ThingDef.Named((string)plan.Attribute("weapon"));
                ThingWithComps gun = (ThingWithComps)ThingMaker.MakeThing(gunDef, GenStuff.DefaultStuffFor(gunDef));
                CompQuality quality = gun.TryGetComp<CompQuality>();
                if (quality != null) quality.SetQuality(QualityCategory.Normal, ArtGenerationContext.Colony);
                shooter.equipment.AddEquipment(gun);
                Verb verb = gun.TryGetComp<CompEquippable>().PrimaryVerb;
                MethodInfo cast = verb.GetType().GetMethod("TryCastShot", BindingFlags.Instance | BindingFlags.NonPublic);
                if (!(verb is Verb_LaunchProjectile) || cast == null) throw new InvalidOperationException("This verb needs a dedicated native accuracy harness.");
                if (verb.verbProps.forcedMissEvenDispersal) throw new InvalidOperationException("Even-dispersal bursts require a full-burst accuracy test; independent projectile trials would be misleading.");
                Action refreshShooter = delegate {
                    if (shooter.Dead || shooter.Destroyed || !shooter.Spawned)
                    {
                        Corpse corpse = shooter.Corpse;
                        if (corpse != null && !corpse.Destroyed) corpse.Destroy(DestroyMode.Vanish);
                        else if (!shooter.Destroyed) shooter.Destroy(DestroyMode.Vanish);
                        shooter = WhiteRange.Shooter(map, origin, skill);
                        RangeHitCounter.Shooter = shooter;
                    }
                    if (gun.Destroyed || shooter.equipment.Primary != gun)
                    {
                        if (!gun.Destroyed) gun.Destroy(DestroyMode.Vanish);
                        gun = (ThingWithComps)ThingMaker.MakeThing(gunDef, GenStuff.DefaultStuffFor(gunDef));
                        CompQuality newQuality = gun.TryGetComp<CompQuality>();
                        if (newQuality != null) newQuality.SetQuality(QualityCategory.Normal, ArtGenerationContext.Colony);
                        shooter.equipment.DestroyAllEquipment(); shooter.equipment.AddEquipment(gun);
                        verb = gun.TryGetComp<CompEquippable>().PrimaryVerb;
                        cast = verb.GetType().GetMethod("TryCastShot", BindingFlags.Instance | BindingFlags.NonPublic);
                    }
                };
                Find.CameraDriver.config.sizeRange = new FloatRange(1, 120);
                Find.CameraDriver.SetRootPosAndSize(map.Center.ToVector3Shifted(), 120);
                AudioListener.volume = 0;
                XElement result = new XElement("accuracy", new XAttribute("gameVersion", VersionControl.CurrentVersionString),
                    new XAttribute("weapon", gunDef.defName), new XAttribute("skill", skill), new XAttribute("quality", "Normal"),
                    new XAttribute("shooterAccuracy", shooter.GetStatValue(StatDefOf.ShootingAccuracyPawn)),
                    new XAttribute("projectileClass", verb.verbProps.defaultProjectile.thingClass.FullName),
                    new XAttribute("accuracyTouch", gun.GetStatValue(StatDefOf.AccuracyTouch)),
                    new XAttribute("accuracyShort", gun.GetStatValue(StatDefOf.AccuracyShort)),
                    new XAttribute("accuracyMedium", gun.GetStatValue(StatDefOf.AccuracyMedium)),
                    new XAttribute("accuracyLong", gun.GetStatValue(StatDefOf.AccuracyLong)),
                    new XAttribute("range", verb.EffectiveRange));
                foreach (XElement distancePlan in plan.Elements("distance"))
                {
                    refreshShooter();
                    int distance = (int)distancePlan;
                    Thing target = GenSpawn.Spawn(ThingDef.Named("RimMaker_RangeTarget"), origin + new IntVec3(distance, 0, 0), map);
                    XElement row = new XElement("row", new XAttribute("distance", distance)); result.Add(row);
                    if (!verb.CanHitTarget(target)) { row.Add(new XAttribute("reachable", false)); target.Destroy(DestroyMode.Vanish); continue; }
                    row.Add(new XAttribute("reachable", true));
                    ShotReport report = ShotReport.HitReportFor(shooter, verb, target);
                    float scatter = VerbUtility.CalculateAdjustedForcedMiss(verb.verbProps.ForcedMissRadius * verb.verbProps.GetForceMissFactorFor(gun, shooter), target.Position - origin);
                    bool ordinary = verb.GetType() == typeof(Verb_Shoot) && verb.verbProps.canGoWild && scatter <= .5f && !verb.verbProps.defaultProjectile.projectile.flyOverhead && !verb.verbProps.defaultProjectile.projectile.alwaysFreeIntercept && verb.verbProps.defaultProjectile.thingClass == typeof(Bullet);
                    row.Add(new XAttribute("analyticApplicable", ordinary), new XAttribute("gameHitChance", report.TotalEstimatedHitChance),
                        new XAttribute("scatterRadius", scatter), new XAttribute("weatherFactor", map.weatherManager.CurWeatherAccuracyMultiplier),
                        new XAttribute("passCoverChance", report.PassCoverChance));
                    int hits = 0, centers = 0, overlaps = 0, coverage = 0;
                    ProjectileProperties properties = verb.verbProps.defaultProjectile.projectile;
                    string effect = properties.postExplosionGasType.HasValue ? properties.postExplosionGasType.Value.ToString() : properties.postExplosionSpawnThingDef == null ? "" : properties.postExplosionSpawnThingDef.defName;
                    float launchDamage = 0, impactDamage = 0, launchAP = 0, impactAP = 0;
                    for (int trial = 0; trial < trials; trial++)
                    {
                        refreshShooter();
                        if (target.Destroyed) target = GenSpawn.Spawn(ThingDef.Named("RimMaker_RangeTarget"), origin + new IntVec3(distance, 0, 0), map);
                        shooter.Position = origin;
                        foreach (Hediff hediff in shooter.health.hediffSet.hediffs.ToList()) shooter.health.RemoveHediff(hediff);
                        shooter.mindState.mentalStateHandler.Reset();
                        foreach (Need need in shooter.needs.AllNeeds) need.CurLevelPercentage = 1;
                        shooter.drafter.Drafted = true; shooter.drafter.FireAtWill = false;
                        shooter.jobs.StartJob(JobMaker.MakeJob(JobDefOf.Wait_Combat), JobCondition.InterruptForced);
                        shooter.stances.CancelBusyStanceSoft();
                        map.weatherManager.TransitionTo(WeatherDefOf.Clear);
                        map.gasGrid.Debug_ClearAll();
                        if (shooter.needs.food != null) shooter.needs.food.CurLevelPercentage = 1;
                        if (shooter.needs.rest != null) shooter.needs.rest.CurLevelPercentage = 1;
                        foreach (Thing thing in map.listerThings.AllThings.Where(t => t is Projectile || t is Explosion || t is Fire || t.def.category == ThingCategory.Filth).ToList()) thing.Destroy(DestroyMode.Vanish);
                        target.HitPoints = target.MaxHitPoints; RangeHitCounter.Hit = false;
                        typeof(Verb).GetField("currentTarget", BindingFlags.Instance | BindingFlags.NonPublic).SetValue(verb, new LocalTargetInfo(target));
                        if (!(bool)cast.Invoke(verb, null)) throw new InvalidOperationException("Native verb refused range " + distance + ", trial " + trial + ", shooter " + shooter.Position + ", target " + target.Position + ".");
                        Projectile projectile = map.listerThings.AllThings.OfType<Projectile>().FirstOrDefault(p => p.Launcher == shooter);
                        if (projectile == null) throw new InvalidOperationException("Native shot did not create a projectile.");
                        launchDamage = projectile.DamageAmount; launchAP = projectile.ArmorPenetration;
                        int elapsed = 0;
                        while (!projectile.Destroyed && elapsed++ < 2400)
                        {
                            impactDamage = projectile.DamageAmount; impactAP = projectile.ArmorPenetration;
                            Find.TickManager.DoSingleTick();
                        }
                        if (!projectile.Destroyed) throw new InvalidOperationException("Projectile did not finish in 2400 game ticks.");
                        for (int extra = 0; extra < 30; extra++) Find.TickManager.DoSingleTick();
                        if (RangeHitCounter.Hit) hits++;
                        if (projectile.Position == target.Position) centers++;
                        if (projectile.Position.DistanceTo(target.Position) <= verb.verbProps.defaultProjectile.projectile.explosionRadius) overlaps++;
                        if (properties.postExplosionGasType.HasValue && map.gasGrid.DensityAt(target.Position, properties.postExplosionGasType.Value) > 0) coverage++;
                        else if (properties.postExplosionSpawnThingDef != null && target.Position.GetThingList(map).Any(t => t.def == properties.postExplosionSpawnThingDef)) coverage++;
                    }
                    row.Add(new XAttribute("trials", trials), new XAttribute("hits", hits), new XAttribute("centerImpacts", centers), new XAttribute("footprintOverlaps", overlaps),
                        new XAttribute("effect", effect), new XAttribute("effectCoverage", coverage),
                        new XAttribute("damageAtLaunch", launchDamage), new XAttribute("damageAtImpact", impactDamage),
                        new XAttribute("penetrationAtLaunch", launchAP), new XAttribute("penetrationAtImpact", impactAP));
                    target.Destroy(DestroyMode.Vanish);
                }
                result.Add(new XElement("errors", PreviewMod.Errors.Select(e => new XElement("error", e))));
                new XDocument(result).Save(Path.Combine(PreviewMod.Output, "accuracy.xml"));
                Application.Quit(PreviewMod.Errors.Count == 0 ? 0 : 1);
            }
            finally { Rand.PopState(); }
        }
    }
}
