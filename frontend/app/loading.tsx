import MusicLoading from "./components/common/MusicLoading";

export default function Loading() {
  return (
    <main
      data-testid="root-loading"
      className="min-h-screen flex items-center justify-center bg-surface-cream transition-colors duration-300"
    >
      <MusicLoading message="Đang tải..." height="200px" />
    </main>
  );
}
