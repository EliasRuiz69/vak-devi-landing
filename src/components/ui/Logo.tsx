type LogoProps = {
  className?: string;
  variant?: "purple" | "white";
};

export default function Logo({ className }: LogoProps) {
  return (
    <div className={`overflow-hidden ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-vak-devi-svg/vak_devi_logo_fondo_transparente.svg"
        alt="Vāk Devi"
        style={{
          display: "block",
          width: "161%",
          maxWidth: "none",
          height: "auto",
          marginLeft: "-34.7%",
          marginTop: "-23.1%",
        }}
      />
    </div>
  );
}
