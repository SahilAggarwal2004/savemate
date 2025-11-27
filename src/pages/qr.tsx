import LinkifiedText from "@/components/LinkifiedText";
import { useRouter } from "next/router";

export default function QRPage() {
  const router = useRouter();
  const { title, text, url } = router.query;

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold text-center">Shared Content</h1>
      {title && <LinkifiedText label="Title">{title}</LinkifiedText>}
      {text && <LinkifiedText label="Text">{text}</LinkifiedText>}
      {url && <LinkifiedText label="Link">{url}</LinkifiedText>}
      {!title && !text && !url && <p className="text-center text-gray-600">Nothing to show. Check the QR content again.</p>}
    </div>
  );
}
