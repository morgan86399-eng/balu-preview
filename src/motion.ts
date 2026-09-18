import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);
gsap.defaults({ duration: 0.6, ease: "power2.out" });

export { gsap, useGSAP };
