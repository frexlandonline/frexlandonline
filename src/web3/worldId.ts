import { MiniKit } from '@worldcoin/minikit-js';
import { encodeAction, generateSignal } from '@worldcoin/idkit-core/hashing';
import { VerificationLevel } from '@worldcoin/idkit-core';
import '@worldcoin/idkit-standalone';
const IDKit = (window as any).IDKit;
import { isWorldAppWebView } from './world';

// Estos valores deben coincidir exactamente con los configurados en el Developer Portal
const WORLDCOIN_APP_ID = "app_16b6ce75c2caa92d0fd4d4e1f42cc2f6";
const WORLDCOIN_ACTION = "auth"; 

export interface WorldIdProof {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: string;
  credential_type?: string;
}

/**
 * Inicia el proceso de verificación de identidad única con World ID
 * @param walletAddress Dirección de la billetera del usuario para vincularla a la verificación
 * @returns Promesa con los datos de la prueba generada
 */
export function verifyHumanity(walletAddress: string): Promise<WorldIdProof> {
  return new Promise((resolve, reject) => {
    try {
      if (isWorldAppWebView()) {
        // Native World App Verification without IDKit
        const timestamp = new Date().toISOString();
        const eventPayload = {
          command: "verify",
          version: 1,
          payload: {
            app_id: WORLDCOIN_APP_ID,
            action: encodeAction(WORLDCOIN_ACTION),
            signal: generateSignal(walletAddress).digest,
            verification_level: VerificationLevel.Orb,
            timestamp
          }
        };
        
        // Listen for the response event
        const handleResponse = (response: any) => {
          MiniKit.unsubscribe('miniapp-verify-action');
          if (response.status === 'success') {
            console.log("Prueba de World ID exitosa:", response.payload);
            resolve(response.payload);
          } else {
            console.error("Error en World ID nativo:", response);
            reject(new Error(response.error_code || "Verificación fallida o cancelada"));
          }
        };
        
        MiniKit.subscribe('miniapp-verify-action', handleResponse);
        
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.minikit) {
          window.webkit.messageHandlers.minikit.postMessage(eventPayload);
        } else if (window.Android && window.Android.postMessage) {
          window.Android.postMessage(JSON.stringify(eventPayload));
        } else {
          reject(new Error("No se pudo encontrar el bridge de MiniKit"));
        }
      } else {
        // Fallback to IDKit for web browsers
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
      }
    } catch (error) {
      console.error("Error al inicializar World ID:", error);
      reject(error);
    }
  });
}
