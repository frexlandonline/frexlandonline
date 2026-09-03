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
            signal: walletAddress || "",
            verification_level: VerificationLevel.Orb,
            timestamp
          }
        };
        
        // Listen for the response event
        const handleResponse = (rawResponse: any) => {
          console.log("[WorldID] Raw response received:", rawResponse);
          MiniKit.unsubscribe('miniapp-verify-action');

          let response = rawResponse;
          if (typeof rawResponse === 'string') {
            try {
              response = JSON.parse(rawResponse);
            } catch (e) {
              console.warn("[WorldID] Failed to parse JSON response:", e);
            }
          }

          const isSuccess = response?.status === 'success' || 
                            Boolean(response?.proof) || 
                            Boolean(response?.payload?.proof) || 
                            Boolean(response?.data?.proof);

          if (isSuccess) {
            const target = response?.payload || response?.data || response?.result || response;
            const proofStr = target?.proof || response?.proof;
            const merkleRoot = target?.merkle_root || response?.merkle_root;
            const nullifierHash = target?.nullifier_hash || response?.nullifier_hash;
            const level = target?.verification_level || response?.verification_level || 'orb';

            if (!proofStr || !nullifierHash) {
              console.error("[WorldID] Missing proof fields in response:", response);
              reject(new Error("La respuesta de World ID no contiene los datos de la prueba"));
              return;
            }

            const proofResult: WorldIdProof = {
              proof: proofStr,
              merkle_root: merkleRoot,
              nullifier_hash: nullifierHash,
              verification_level: level,
              credential_type: target?.credential_type || response?.credential_type
            };

            console.log("[WorldID] Parsed proof successfully:", proofResult);
            resolve(proofResult);
          } else {
            console.error("Error en World ID nativo:", response);
            const errCode = response?.error_code || response?.errorCode || "Verificación fallida o cancelada";
            reject(new Error(errCode === 'user_rejected' ? "Verificación cancelada por el usuario" : errCode));
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
