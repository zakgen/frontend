import { notFound } from "next/navigation";

import { ChatInbox } from "@/components/chats/chat-inbox";

type Params = Promise<{
  businessId: string;
}>;

export default async function BusinessChatsPage({
  params,
}: Readonly<{
  params: Params;
}>) {
  const { businessId } = await params;
  const parsedBusinessId = Number(businessId);

  if (!Number.isFinite(parsedBusinessId) || parsedBusinessId <= 0) {
    notFound();
  }

  return <ChatInbox businessId={parsedBusinessId} />;
}
