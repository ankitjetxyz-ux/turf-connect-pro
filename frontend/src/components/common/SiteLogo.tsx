import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import turfSymbol from "@/assets/logo/turf-symbol.png";

type SiteLogoProps = {
  to?: string | null;
  className?: string;
  imageClassName?: string;
};

const SiteLogo = ({ to = "/", className, imageClassName }: SiteLogoProps) => {
  const logo = (
    <img
      src={turfSymbol}
      alt="Book My Turf"
      className={cn(
        "h-11 w-11 md:h-12 md:w-12 object-contain",
        imageClassName,
      )}
      draggable={false}
    />
  );

  if (to != null && to !== "") {
    return (
      <Link
        to={to}
        className={cn("inline-flex items-center shrink-0 py-1", className)}
        aria-label="Book My Turf home"
      >
        {logo}
      </Link>
    );
  }

  return (
    <div className={cn("inline-flex items-center shrink-0", className)}>
      {logo}
    </div>
  );
};

export default SiteLogo;
