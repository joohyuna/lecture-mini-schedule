import BottomNav from "../components/BottomNav";
import RegisteredToast from "../components/RegisteredToast";
import SyncErrorToast from "../components/SyncErrorToast";
import { DiaryProvider } from "../lib/DiaryContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DiaryProvider>
      <div className="pb-20">{children}</div>
      <BottomNav />
      <SyncErrorToast />
      <RegisteredToast />
    </DiaryProvider>
  );
}
