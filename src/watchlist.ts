import { Command } from "commander";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import os from "os";
import fs from "fs-extra";
import path from "path";
import yaml from "yaml";

const CONFIG_FILE = path.join(os.homedir(), "watchlist.yml");

function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      console.error(`\n❌ Config file not found. Please create: ${CONFIG_FILE}\n`);
      process.exit(1);
    }
    const fileContent = fs.readFileSync(CONFIG_FILE, "utf8");
    return yaml.parse(fileContent);
  } catch (error) {
    console.error("\n❌ Failed to load config file\n", error);
    process.exit(1);
  }
}

const config = loadConfig();
const SUPABASE_URL = config.SUPABASE_URL;
const SUPABASE_KEY = config.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("\n❌ Missing Supabase credentials in watchlist.yml\n");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const program = new Command();

const watchlistSchema = z.object({
  title: z.string().min(1, "❌ Title cannot be empty").max(250, "❌ Title is too long"),
});

program.version("0.0.1").description("\n🎬 Movie & Series Watchlist CLI");

program
  .command("add <title>")
  .description("➕ Add a movie or series to your watchlist")
  .action(async (title) => {
    try {
      const validated = watchlistSchema.parse({ title });

      const { data: existing, error: fetchError } = await supabase
        .from("watchlist")
        .select("id")
        .eq("title", validated.title)
        .maybeSingle();

      if (fetchError) throw new Error(fetchError.message);
      if (existing) return console.log("\n⚠️  Already in your watchlist!\n");

      const { error } = await supabase.from("watchlist").insert([{ title: validated.title, watched: false }]);
      if (error) throw new Error(error.message);

      console.log("\n✅ Successfully added to your watchlist! 🎉\n");
    } catch (error) {
      console.error(`\n❌ ${error instanceof Error ? error.message : "Invalid input"}\n`);
    }
  });

program
  .command("list")
  .description("📜 Display your watchlist")
  .action(async () => {
    try {
      const { data, error } = await supabase.from("watchlist").select("id, title, watched, created_at").order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      if (!data || data.length === 0) return console.log("\n📜 Your watchlist is empty. Start adding movies! 🍿\n");

      console.log("\n🎥 Your Watchlist:\n");
      data.forEach(({ id, title, watched }) => {
        console.log(` 🎞️  ${id} | ${title} - ${watched ? "✔ Watched" : "❌ Unwatched"}`);
      });
      console.log("");
    } catch (error) {
      console.error(`\n❌ ${error instanceof Error ? error.message : "Failed to fetch watchlist"}\n`);
    }
  });

program
  .command("toggle <id>")
  .description("🔄 Mark a movie as watched/unwatched")
  .action(async (id) => {
    try {
      const { data: item, error: fetchError } = await supabase.from("watchlist").select("watched").eq("id", id).maybeSingle();

      if (fetchError) throw new Error(fetchError.message);
      if (!item) return console.log("\n⚠️  Item not found in your watchlist.\n");

      const { error: updateError } = await supabase.from("watchlist").update({ watched: !item.watched }).eq("id", id);
      if (updateError) throw new Error(updateError.message);

      console.log(`\n🔄 Status updated: ${item.watched ? "❌ Marked as Unwatched" : "✔ Marked as Watched"} ✅\n`);
    } catch (error) {
      console.error(`\n❌ ${error instanceof Error ? error.message : "Update failed"}\n`);
    }
  });

program
  .command("remove <id>")
  .description("🗑️  Remove a movie from your watchlist")
  .action(async (id) => {
    try {
      const itemId = parseInt(id, 10);
      if (isNaN(itemId)) {
        return console.log("\n❌ Invalid ID. Please enter a valid number.\n");
      }

      const { data: existingItem, error: fetchError } = await supabase
        .from("watchlist")
        .select("id")
        .eq("id", itemId)
        .maybeSingle();

      if (fetchError) throw new Error(fetchError.message);
      if (!existingItem) return console.log("\n⚠️  Item not found in your watchlist.\n");

      const { error: deleteError } = await supabase.from("watchlist").delete().eq("id", itemId);

      if (deleteError) throw new Error(deleteError.message);

      console.log("\n🗑️  Successfully removed from your watchlist! ❌\n");
    } catch (error) {
      console.error(`\n❌ ${error instanceof Error ? error.message : "Deletion failed"}\n`);
    }
  });

program
  .command("search <query>")
  .description("🔎 Search for a movie in your watchlist")
  .action(async (query) => {
    try {
      const { data, error } = await supabase.from("watchlist").select("id, title, watched").ilike("title", `%${query}%`);

      if (error) throw new Error(error.message);
      if (!data.length) return console.log("\n⚠️  No matching movies found.\n");

      console.log("\n🔍  Search Results:\n");
      data.forEach(({ id, title, watched }) => {
        console.log(` 🎞️  ${id}  | ${title} - ${watched ? "✔ Watched" : "❌ Unwatched"}`);
      });
      console.log("");
    } catch (error) {
      console.error(`\n❌ ${error instanceof Error ? error.message : "Search failed"}\n`);
    }
  });

program.parse(process.argv);
