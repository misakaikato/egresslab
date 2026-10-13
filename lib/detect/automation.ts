// 自动化与 Cookie 特征
export function collectAutomation(): { webdriver: boolean; cookie: boolean; webglRenderer: string; swiftShader: boolean } {
  let webglRenderer = "";
  try {
    const c = document.createElement("canvas").getContext("webgl");
    const ext = c?.getExtension("WEBGL_debug_renderer_info");
    if (c && ext) webglRenderer = String(c.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "");
  } catch {}
  return {
    webdriver: !!navigator.webdriver,
    cookie: !!navigator.cookieEnabled,
    webglRenderer,
    swiftShader: /swiftshader|llvmpipe|software|microsoft basic render/i.test(webglRenderer),
  };
}
