import MusicLoading from "../components/common/MusicLoading";

export default function Loading() {
  return (
    <div data-testid="admin-loading" className="w-full flex items-center justify-center py-24">
      <MusicLoading message="Đang tải dữ liệu..." height="300px" />
    </div>
  );
}
