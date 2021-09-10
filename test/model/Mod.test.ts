import RedisDB from "../../core/RedisDB.ts";
import { assert } from "../../deps.ts";
import { Mod, ModEventType, ModWarningType } from "../../model/Mod.ts";
import { UserRole } from "../../model/User.ts";

await RedisDB.connect(); // Connect To Redis

Deno.test("Check if mods can perform given actions.", () => {
	assert(Mod.canModPerformThis(UserRole.Mod, ModEventType.Report), `Mods are not able to perform "Report" command.`);
	assert(Mod.canModPerformThis(UserRole.Mod, ModEventType.ApplyWarning), `Mods are not able to perform "Apply Warning" command.`);
	assert(Mod.canModPerformThis(UserRole.Mod, ModEventType.Quiet), `Mods are not able to perform "Quiet" command.`);
	assert(Mod.canModPerformThis(UserRole.Mod, ModEventType.Mute), `Mods are not able to perform "Mute" command.`);
	assert(!Mod.canModPerformThis(UserRole.Mod, ModEventType.TemporaryBan), `Mods should not be able to perform "Temporary Ban" command. Reserved for staff.`);
	assert(!Mod.canModPerformThis(UserRole.Mod, ModEventType.Ban), `Mods should not be able to perform "Ban" command. Reserved for staff.`);
	assert(Mod.canModPerformThis(UserRole.Staff, ModEventType.TemporaryBan), `Staff is unable to perform "Temporary Ban" command.`);
	assert(Mod.canModPerformThis(UserRole.Staff, ModEventType.Ban), `Staff is unable to perform "Ban" command.`);
});

Deno.test("Verify Mod Summaries.", () => {
	
	const sum1 = Mod.summarizeModEvent("TheMod", 10, "BadGuy", ModEventType.Report, ModWarningType.Incite);
	assert(sum1 === "10:TheMod reported BadGuy for inciting hostility.", `Mod Summary (Report) is reporting incorrectly.`);
	
	const sum2 = Mod.summarizeModEvent("TheMod", 10, "BadGuy", ModEventType.Mute, ModWarningType.Misinformation);
	assert(sum2 === "10:TheMod muted BadGuy for spreading misinformation.", `Mod Summary (Mute) is reporting incorrectly.`);
	
	const sum3 = Mod.summarizeModEvent("TheMod", 10, "BadGuy", ModEventType.ApplyWarning, ModWarningType.Inappropriate);
	assert(sum3 === "10:TheMod warned BadGuy for inappropriate behavior.", `Mod Summary (Apply Warning) is reporting incorrectly.`);
});

Deno.test("Get Mod Events.", async () => {
	const userModEvents = await Mod.getModEventsByUser(3)
	const modEvents = await Mod.getModEventHistory();
});

