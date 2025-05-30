export default ({ config }) => ({
    ...config,
    name: getAppName(),
    ios: {
        ...config.ios,
        bundleIdentifier: getUniqueIdentifier(),
    },
    android: {
        ...config.android,
        package: getUniqueIdentifier(),
    }
});

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
    if (IS_DEV) {
        return "com.davidtowers.algebro.dev";
    }
    if (IS_PREVIEW) {
        return "com.davidtowers.algebro.preview";
    }
    return "com.davidtowers.algebro";
};

const getAppName = () => {
    if (IS_DEV) {
        return "Algebro Dev";
    }
    if (IS_PREVIEW) {
        return "Algebro Preview";
    }
    return "Algebro";
};
