import { MediaBrowser } from "@/components/admin/media-browser";
import { PageHeaderStatic } from "@/components/admin/page-header";

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const k = kind === "image" || kind === "video" ? kind : undefined;
  return (
    <div>
      <PageHeaderStatic
        title={k === "image" ? "Site Images" : k === "video" ? "Site Videos" : "Media Library"}
        description="Upload, preview, rename, categorise and delete files. Copy a file's URL to use it anywhere, or pick files directly from any image/video field."
      />
      <MediaBrowser key={k ?? "all"} kind={k} />
    </div>
  );
}
