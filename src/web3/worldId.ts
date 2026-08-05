import '@worldcoin/idkit-standalone';
const IDKit = (window as any).IDKit;

// TODO: Reemplazar con el App ID real generado en el Developer Portal de Worldcoin
const WORLDCOIN_APP_ID = 'app_staging_00000000000000000000000000000000';
const WORLDCOIN_ACTION = 'submit-score';

export interface WorldIdProof {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
}

/**
 * Abre el widget de World ID para solicitar la prueba de humanidad.
 * @param walletAddress - Dirección de la wallet que firma la acción.
 * @returns Promesa que se resuelve con las pruebas generadas.
 */
export function verifyHumanity(walletAddress: string): Promise<WorldIdProof> {
  return new Promise((resolve, reject) => {
    try {
      IDKit.init({
        app_id: WORLDCOIN_APP_ID,
        action: WORLDCOIN_ACTION,
        signal: walletAddress,
        onSuccess: (proof: WorldIdProof) => {
          console.log("Prueba de World ID exitosa:", proof);
          resolve(proof);
        },
        onError: (err: any) => {
          console.error("Error en World ID:", err);
          reject(err);
        },
        verification_level: 'orb' as any
      });
      
      IDKit.open();
    } catch (error) {
      console.error("Error al inicializar World ID:", error);
      reject(error);
    }
  });
}
