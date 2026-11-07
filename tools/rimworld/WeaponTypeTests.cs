using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Xml.Linq;
using RimWorld;
using UnityEngine;
using Verse;
using Verse.AI;
namespace RimMaker.ShootingPreview
{
    public sealed class WeaponTypeTests : GameComponent
    {
        bool started;
        public WeaponTypeTests(Game game) { }
        public override void GameComponentUpdate()
        {
            string output;
            if (started || !GenCommandLine.TryGetCommandLineArg("rimmaker-weapon-types", out output) || Current.ProgramState != ProgramState.Playing || LongEventHandler.ShouldWaitForEvent) return;
            started = true;
            var report = new XElement("weaponTypes", new XAttribute("gameVersion", VersionControl.CurrentVersionString));
            try
            {
                Find.TickManager.CurTimeSpeed = TimeSpeed.Paused;
                Map map = Find.CurrentMap; WhiteRange.Clear(map, map.Center);
                IntVec3 origin = map.Center + new IntVec3(-20, 0, 0);
                foreach (XElement plan in XDocument.Load(Path.Combine(output, "plan.xml")).Root.Elements("weapon"))
                {
                    var row = new XElement("case", new XAttribute("defName", (string)plan.Attribute("defName"))); report.Add(row);
                    try
                    {
                        foreach (Thing effect in map.listerThings.AllThings.ToList()) if (effect is Fire || effect is Explosion || effect is Projectile || effect.def.defName == "RimMaker_RuntimeTarget" || effect is Pawn) effect.Destroy(DestroyMode.Vanish);
                        map.gasGrid.Debug_ClearAll();
                        ThingDef def = ThingDef.Named((string)plan.Attribute("defName"));
                        bool melee = (string)plan.Attribute("kind") == "melee";
                        Require(melee ? def.IsMeleeWeapon : def.IsRangedWeapon, "Wrong native weapon classification.");
                        Pawn shooter = WhiteRange.Shooter(map, origin, 20);
                        shooter.skills.GetSkill(SkillDefOf.Melee).Level = 20;
                        RecipeDef recipe = DefDatabase<RecipeDef>.AllDefs.FirstOrDefault(r => r.products != null && r.products.Any(p => p.thingDef == def));
                        Require(recipe != null && recipe.recipeUsers.Count > 0, "Missing crafting recipe or bench.");
                        var ingredients = new List<Thing>();
                        foreach (ThingDefCountClass cost in def.costList ?? new List<ThingDefCountClass>()) { Thing ingredient = ThingMaker.MakeThing(cost.thingDef); ingredient.stackCount = cost.count; ingredients.Add(ingredient); }
                        Thing dominant = ingredients.FirstOrDefault();
                        if (def.MadeFromStuff) { dominant = ThingMaker.MakeThing(ThingDefOf.Steel); dominant.stackCount = def.costStuffCount; ingredients.Add(dominant); }
                        Building_WorkTable table = (Building_WorkTable)GenSpawn.Spawn(ThingMaker.MakeThing(recipe.recipeUsers[0]), origin + new IntVec3(-5, 0, -5), map);
                        ThingWithComps gun = GenRecipe.MakeRecipeProducts(recipe, shooter, ingredients, dominant, table).FirstOrDefault(p => p.def == def) as ThingWithComps;
                        Require(gun != null, "Recipe did not produce equipment."); table.Destroy(DestroyMode.Vanish);
                        Require(!def.MadeFromStuff || gun.Stuff == ThingDefOf.Steel, "Crafting material lost.");
                        shooter.equipment.AddEquipment(gun);
                        Require(gun.Graphic.MatSingle.mainTexture != BaseContent.BadTex, "Missing weapon texture.");
                        Thing target = GenSpawn.Spawn(ThingDef.Named("RimMaker_RuntimeTarget"), origin + new IntVec3(melee ? 1 : 8, 0, 0), map);
                        if (melee)
                        {
                            List<Verb> attacks = gun.GetComp<CompEquippable>().AllVerbs.Where(v => v.IsMeleeAttack).ToList();
                            Require(attacks.Count > 0, "No melee attacks resolved.");
                            foreach (Verb attack in attacks)
                            {
                                int hp = target.HitPoints;
                                for (int attempt = 0; attempt < 12 && target.HitPoints == hp; attempt++)
                                {
                                    shooter.stances.CancelBusyStanceSoft(); shooter.jobs.StartJob(JobMaker.MakeJob(JobDefOf.Wait_Combat), JobCondition.InterruptForced);
                                    Require(attack.TryStartCastOn(target), "Melee attack refused adjacent target.");
                                    for (int t = 0; t < 180; t++) Find.TickManager.DoSingleTick();
                                }
                                Require(target.HitPoints < hp, "Melee attack did not damage target.");
                            }
                            row.Add(new XAttribute("meleeAttacks", attacks.Count));
                        }
                        else
                        {
                            Verb verb = gun.GetComp<CompEquippable>().PrimaryVerb;
                            Require(verb.GetType().Name == ((string)plan.Attribute("kind") == "grenade" ? "Verb_LaunchProjectile" : "Verb_Shoot"), "Wrong native firing/throwing verb.");
                            ThingDef projectileDef = verb.verbProps.defaultProjectile;
                            Thing image = ThingMaker.MakeThing(projectileDef); Require(image.Graphic.MatSingle.mainTexture != BaseContent.BadTex, "Missing projectile texture."); image.Destroy(DestroyMode.Vanish);
                            shooter.jobs.StartJob(JobMaker.MakeJob(JobDefOf.Wait_Combat), JobCondition.InterruptForced);
                            Require(verb.TryStartCastOn(target), "Grenade refused a target in range.");
                            bool observed = false;
                            for (int t = 0; t < 1000; t++) { Find.TickManager.DoSingleTick(); observed |= map.listerThings.ThingsInGroup(ThingRequestGroup.Projectile).OfType<Projectile>().Any(p => p.Launcher == shooter); }
                            Require(observed, "No thrown projectile observed.");
                            Require(!map.listerThings.ThingsInGroup(ThingRequestGroup.Projectile).OfType<Projectile>().Any(), "Grenade/fuse did not complete.");
                            Require(!gun.Destroyed && shooter.equipment.Primary == gun, "Reusable grenade was consumed.");
                            foreach (Thing effect in map.listerThings.AllThings.ToList()) if (effect is Fire || effect is Explosion) effect.Destroy(DestroyMode.Vanish);
                            Pawn mech = null;
                            if (projectileDef.projectile.damageDef == DamageDefOf.EMP)
                            {
                                target.Destroy(DestroyMode.Vanish);
                                mech = PawnGenerator.GeneratePawn(ThingDef.Named("Mech_Scyther").race.AnyPawnKind, Faction.OfMechanoids);
                                GenSpawn.Spawn(mech, origin + new IntVec3(8, 0, 0), map); target = mech;
                                mech.jobs.StartJob(JobMaker.MakeJob(JobDefOf.Wait_Combat), JobCondition.InterruptForced);
                            }
                            bool stunned = false, gas = false, fire = false; int originalHp = target.HitPoints;
                            for (int attempt = 0; attempt < 30; attempt++)
                            {
                                Projectile projectile = (Projectile)GenSpawn.Spawn(projectileDef, origin, map);
                                projectile.Launch(shooter, origin.ToVector3Shifted(), target, target, ProjectileHitFlags.IntendedTarget, false, gun);
                                for (int t = 0; t < 700; t++)
                                {
                                    Find.TickManager.DoSingleTick();
                                    stunned |= mech != null && mech.stances.stunner.Stunned;
                                    fire |= map.listerThings.ThingsOfDef(ThingDefOf.Fire).Count > 0;
                                    gas |= projectileDef.projectile.postExplosionGasType.HasValue && map.gasGrid.DensityAt(target.Position, projectileDef.projectile.postExplosionGasType.Value) > 0;
                                    if (projectile.Destroyed && t > 300) break;
                                }
                                Require(projectile.Destroyed, "Controlled grenade never completed its fuse/impact.");
                                if (stunned || gas || fire || target.HitPoints < originalHp) break;
                            }
                            string damage = projectileDef.projectile.damageDef.defName;
                            if (damage == "EMP") Require(stunned, "EMP did not stun an actual mechanoid.");
                            else if (projectileDef.projectile.postExplosionGasType.HasValue) Require(gas, "Grenade did not create its configured gas.");
                            else if (damage == "Flame") Require(fire, "Molotov did not create fire.");
                            else Require(target.HitPoints < originalHp, "Frag grenade caused no damage.");
                            row.Add(new XAttribute("projectile", projectileDef.defName), new XAttribute("fuseTicks", projectileDef.projectile.explosionDelay), new XAttribute("damage", damage), new XAttribute("stun", stunned), new XAttribute("gas", gas), new XAttribute("fire", fire));
                        }
                        ThingWithComps dropped;
                        Require(shooter.equipment.TryDropEquipment(gun, out dropped, origin + new IntVec3(-2, 0, 0), false), "Equipment could not be dropped.");
                        dropped.Destroy(DestroyMode.Vanish);
                        row.Add(new XAttribute("status", "passed"));
                    }
                    catch (Exception error) { row.Add(new XAttribute("status", "failed"), new XElement("failure", error.ToString())); }
                }
                new XDocument(report).Save(Path.Combine(output, "results.xml"));
                Application.Quit(report.Elements("case").All(row => (string)row.Attribute("status") == "passed") ? 0 : 1);
            }
            catch (Exception error) { File.WriteAllText(Path.Combine(output, "capture-error.txt"), error.ToString()); Application.Quit(1); }
        }
        static void Require(bool value, string message) { if (!value) throw new InvalidOperationException(message); }
    }
}
