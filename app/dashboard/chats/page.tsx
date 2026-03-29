import { ChatInbox } from "@/components/chats/chat-inbox";

const businessId = Number(process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID ?? "1");

export default function ChatsPage() {
  return <ChatInbox businessId={businessId} />;
}
