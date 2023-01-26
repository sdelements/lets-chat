// https://inlang.com/documentation
export async function defineConfig(env) {
    const plugin = await env.$import(
        "https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1/dist/index.js"
    );

    const pluginConfig = {
        pathPattern: "./locales/{language}.json",
    };

    return {
        referenceLanguage: "en",
        languages: [
            "az",
            "de",
            "en",
            "es",
            "fi",
            "fr",
            "is",
            "it",
            "ja",
            "ko",
            "nl",
            "pl",
            "pt",
            "ru",
            "tr",
            "zh-TW",
            "zh",
        ],
        readResources: (args) =>
            plugin.readResources({ ...args, ...env, pluginConfig }),
        writeResources: (args) =>
            plugin.writeResources({ ...args, ...env, pluginConfig }),
    };
}
