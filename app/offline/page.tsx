// app/offline/page.tsx
import OfflineContentList from "@/components/OfflineContentList";

export const metadata = { title: "Offline Content | CodeElysium" };

export default function OfflineIndexPage() {
  return (
    <main className="p-6 md:p-10">
      <h1 className="text-2xl font-bold mb-4">Offline Learning Packs</h1>
      <OfflineContentList />
    </main>
  );
}
