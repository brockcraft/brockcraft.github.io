/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly NOTION_TOKEN?: string;
  readonly NOTION_DATABASE_ID?: string;
  readonly NOTION_PROP_SLUG?: string;
  readonly NOTION_PROP_TAGS?: string;
  readonly NOTION_PROP_PUBLISHED?: string;
  readonly NOTION_PROP_SUMMARY?: string;
  readonly NOTION_PROP_DATE?: string;
  readonly NOTION_PROP_COVER?: string;
}
