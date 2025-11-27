import Linkify from "linkify-react";

export default function LinkifiedText({ label, children }: LinkifiedTextProps) {
  return (
    <div>
      <div className="font-semibold mb-1">{label}</div>
      <div className="whitespace-pre-wrap wrap-break-word">
        <Linkify options={{ target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 underline break-all" }}>{children}</Linkify>
      </div>
    </div>
  );
}
