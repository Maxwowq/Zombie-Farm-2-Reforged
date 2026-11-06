import { installCanvasTranslation } from "./canvas";
import { installDomTranslation } from "./dom";

if (!document.documentElement?.hasAttribute("data-zf-zh-extension")) {
  installCanvasTranslation();
  installDomTranslation();
  document.documentElement?.setAttribute("data-zf-zh-extension", "0.1.1");
}
