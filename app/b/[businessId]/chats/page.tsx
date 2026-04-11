import { notFound } from "next/navigation";

import { ChatInbox } from "@/components/chats/chat-inbox";

type Params = Promise<{
  businessId: string;
}>;

type SearchParams = Promise<{
  phone?: string;
  scope?: string;
}>;

export default async function BusinessChatsPage({
  params,
  searchParams,
}: Readonly<{
  params: Params;
  searchParams: SearchParams;
}>) {
  const { businessId } = await params;
  const { phone, scope } = await searchParams;
  const parsedBusinessId = Number(businessId);

  if (!Number.isFinite(parsedBusinessId) || parsedBusinessId <= 0) {
    notFound();
  }

  return (
    <ChatInbox
      businessId={parsedBusinessId}
      initialPhone={phone}
      initialScope={scope}
    />
  );
}
