import chromium from '@sparticuz/chromium';

export async function getChromium() {
  await chromium.init();
  
  const options = {
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    }
  };

  return options;
}
