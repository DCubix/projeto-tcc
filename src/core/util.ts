import { Quaternion, Vector3 } from "@math.gl/core";
import { Texture2D } from "../graphics/texture";

export class Util {

    public static async loadTexture(url: string): Promise<Texture2D> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.setAttribute('crossOrigin', 'Anonymous');
            image.onload = () => {
                const texture = new Texture2D(image.width, image.height);
                
                const canvas = document.createElement("canvas");
                canvas.width = image.width;
                canvas.height = image.height;
                const context = canvas.getContext("2d")!;
                context.drawImage(image, 0, 0);
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
