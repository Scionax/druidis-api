import { config } from "../../config.ts";
import RedisDB from "../../core/RedisDB.ts";
import { assert } from "../../deps.ts";
import { Mod, ModEventType, ModWarningType } from "../../model/Mod.ts";
import { UserRole } from "../../model/User.ts";

await RedisDB.connect(); // Connect To Redis

Deno.test("Check if mods can perform given actions.", () => {
	assert(Mod.canModPerformThis(UserRole.Mod, ModEventType.Report), `Mods are not able to perform "Report" command.`);
	assert(Mod.canModPerformThis(UserRole.Mod, ModEventType.Warning), `Mods are not able to perform "Apply Warning" command.`);
	assert(Mod.canModPerformThis(UserRole.Mod, ModEventType.Quiet), `Mods are not able to perform "Quiet" command.`);
	assert(Mod.canModPerformThis(UserRole.Mod, ModEventType.Mute), `Mods are not able to perform "Mute" command.`);
	assert(!Mod.canModPerformThis(UserRole.Mod, ModEventType.TemporaryBan), `Mods should not be able to perform "Temporary Ban" command. Reserved for staff.`);
	assert(!Mod.canModPerformThis(UserRole.Mod, ModEventType.Ban), `Mods should not be able to perform "Ban" command. Reserved for staff.`);
	assert(Mod.canModPerformThis(UserRole.Staff, ModEventType.TemporaryBan), `Staff is unable to perform "Temporary Ban" command.`);
	assert(Mod.canModPerformThis(UserRole.Staff, ModEventType.Ban), `Staff is unable to perform "Ban" command.`);
});

Deno.test("Verify Mod Summaries.", () => {
	if(config.prod) { return; } // Don't test this on production.
	
	const sum1 = Mod.summarizeModEvent("TheMod", "AnnoyingGuest", ModEventType.Report, ModWarningType.Incite);
	assert(sum1 === "TheMod reported AnnoyingGuest for inciting hostility.", `Mod Summary (Report) is reporting incorrectly.`);
	
	const sum2 = Mod.summarizeModEvent("TheMod", "AnnoyingGuest", ModEventType.Mute, ModWarningType.Misinformation);
	assert(sum2 === "TheMod muted AnnoyingGuest for spreading misinformation.", `Mod Summary (Mute) is reporting incorrectly.`);
	
	const sum3 = Mod.summarizeModEvent("TheMod", "AnnoyingGuest", ModEventType.Warning, ModWarningType.Inappropriate);
	assert(sum3 === "TheMod warned AnnoyingGuest for inappropriate behavior.", `Mod Summary (Apply Warning) is reporting incorrectly.`);
});

Deno.test("Parse Mod Event String.", () => {
	const parse1 = Mod.parseModEventString("2~3~6~8~1631240337~Zoopy Boop");
	const parse2 = Mod.parseModEventString("2~3~1~2~1631240337~Ziggle Zam");
	
	assert(parse1.reason === "Zoopy Boop" && parse1.modId === 2 && parse1.type === ModEventType.Mute, "Mod.parseModEventString() is parsing incorrectly.");
	assert(parse2.userId === 3 && parse2.time === 1631240337 && parse2.warning === ModWarningType.ExcessNegativity, "Mod.parseModEventString() is parsing incorrectly.");
});

Deno.test("Get Mod Events.", async () => {
	if(config.prod) { return; } // Don't test this on production.
	
	const modReports = await Mod.getModReports(3);
	const modActions = await Mod.getModActions(2);
	const modEvents = await Mod.getModEventHistory();
	
	// If these lines are failing, make sure that LocalServer created the Mod Reports between TheMod and AnnoyingGuest
	assert(modReports[0].userId === 3, `Mod.getModReports(userId) did not return correct result.`);
	assert(modReports[1].type === ModEventType.Report, `Mod.getModReports(userId) did not return correct result.`);
	assert(modActions[0].modId === 2, `Mod.getModActions(modId) did not return correct result.`);
	assert(modActions[1].reason === "User was annoying me.", `Mod.getModActions(modId) did not return correct result.`);
	assert(modEvents[0].type === ModEventType.Mute, `Mod Event global history is not reporting correctly.`);
	assert(modEvents[1].warning === ModWarningType.ExcessNegativity, `Mod Event global history is not reporting correctly.`);
});
