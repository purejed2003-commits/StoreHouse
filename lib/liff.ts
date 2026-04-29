import liff from '@line/liff';

export const initLiff = async () => {
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
