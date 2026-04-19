import { useState } from "react";
import FeedSection from "@/components/sections/FeedSection";
import ChatsSection from "@/components/sections/ChatsSection";
import ProfileSection from "@/components/sections/ProfileSection";
import SearchSection from "@/components/sections/SearchSection";
import NotificationsSection from "@/components/sections/NotificationsSection";
import LiveSection from "@/components/sections/LiveSection";
import BottomNav from "@/components/layout/BottomNav";
import TopBar from "@/components/layout/TopBar";

export type TabType = "feed" | "search" | "live" | "chats" | "profile";

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [showNotifications, setShowNotifications] = useState(false);

  const renderContent = () => {
    if (showNotifications) return <NotificationsSection onBack={() => setShowNotifications(false)} />;
    switch (activeTab) {
      case "feed": return <FeedSection />;
      case "search": return <SearchSection />;
      case "live": return <LiveSection />;
      case "chats": return <ChatsSection />;
      case "profile": return <ProfileSection />;
      default: return <FeedSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background mesh-bg flex flex-col max-w-md mx-auto relative">
      <TopBar
        activeTab={activeTab}
        onNotifications={() => setShowNotifications(!showNotifications)}
        notificationsOpen={showNotifications}
      />
      <main className="flex-1 overflow-y-auto pb-20 pt-14">
        <div key={showNotifications ? "notif" : activeTab} className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
      <BottomNav activeTab={activeTab} onChange={(tab) => { setActiveTab(tab); setShowNotifications(false); }} />
    </div>
  );
}
