interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-xl font-bold text-textBody">{title}</h1>
      <p className="text-sm text-textBody/60">หน้านี้อยู่ระหว่างการพัฒนา</p>
    </div>
  );
}
