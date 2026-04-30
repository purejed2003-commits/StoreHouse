import liff from '@line/liff';

const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const DEV_PROFILE = {
  userId: 'dev-user-local',
  displayName: 'Dev (localhost)',
  pictureUrl: '',
};

export const initLiff = async () => {
  if (isLocalhost) {
    return { liff: null as any, profile: DEV_PROFILE };
  }

  const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
  if (!liffId) {
    console.warn("LINE LIFF ID is missing in environment variables.");
    return null;
  }

  try {
    await liff.init({ liffId });

    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      return { liff, profile };
    } else {
      liff.login();
      return null;
    }
  } catch (error) {
    console.error("LIFF Initialization failed", error);
    return null;
  }
};
