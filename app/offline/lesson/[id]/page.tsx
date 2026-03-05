// app/offline/lesson/[id]/page.tsx
import OfflineLessonView from "@/components/OfflineLessonView";

interface Props {
  params: { id: string };
}

export default function LessonPage({ params }: Props) {
  const id = params.id;
  // Render client component which will use IDB/fetch
  return (
    <main className="p-6 md:p-10">
      {/* @ts-expect-error Client component */}
      <OfflineLessonView lessonId={id} />
    </main>
  );
}
