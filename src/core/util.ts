import { Texture2D, TextureFormat, TextureType } from "../graphics/texture";

export class Util {

    public static async loadTexture(url: string): Promise<Texture2D> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.setAttribute('crossOrigin', 'Anonymous');
            image.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = image.width;
                canvas.height = image.height;
                const context = canvas.getContext("2d")!;
                context.drawImage(image, 0, 0);

                const texture = new Texture2D(image.width, image.height, TextureType[TextureFormat.Rgba8]);
                texture.update(context.getImageData(0, 0, image.width, image.height).data);

                resolve(texture);
            }
            image.onerror = (error) => {
                reject(error);
            }
            image.src = url;
        });
    }

}

declare global {
    interface Math {
        lerp(from: number, to: number, factor: number): number;
        clamp(value: number, min: number, max: number): number;
        radians(degrees: number): number;
        degrees(radians: number): number;
    }
}

Math.lerp = function (from: number, to: number, factor: number): number {
    return from + (to - from) * factor;
};

Math.radians = function (degrees: number): number {
    return degrees * (Math.PI / 180);
};

Math.degrees = function (radians: number): number {
    return radians * (180 / Math.PI);
};

Math.clamp = function (value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
};

export {};