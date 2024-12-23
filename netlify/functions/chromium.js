import path from 'path';
import { getReadableDirectory } from 'lambdafs';

const CHROME_PATH = path.join(
  'chrome-aws-lambda',
  'bin',
  process.platform === 'linux' ? 'chromium' : 'chrome'
);

export async function getChromium() {
  const directory = await getReadableDirectory();
  const executablePath = path.join(directory, CHROME_PATH);
  
  const chromium = {
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-extensions'
    ],
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    },
    headless: true
  };

  return chromium;
}
