const db = require('../database');
const crypto = require('crypto');

class DigitalSignature {
    // Assinar uma escritura
    static sign(escrituraId, userId, password) {
        try {
            // Buscar escritura
            const escritura = db.prepare('SELECT * FROM escrituras WHERE id = ?').get(escrituraId);
            if (!escritura) {
                throw new Error('Escritura não encontrada');
            }

            // Buscar chaves do usuário
            const user = db.prepare('SELECT private_key_encrypted, public_key FROM users WHERE id = ?').get(userId);
            if (!user || !user.private_key_encrypted) {
                throw new Error('Usuário não possui chaves RSA');
            }

            // Descriptografar chave privada
            const encryptedData = JSON.parse(user.private_key_encrypted);
            const salt = Buffer.from(encryptedData.salt, 'hex');
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const key = crypto.scryptSync(password, salt, 32);

            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let privateKey = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            privateKey += decipher.final('utf8');

            // Gerar hash do documento (campos críticos)
            const documentData = {
                uuid: escritura.uuid,
                tipo: escritura.tipo,
                selagem: escritura.selagem,
                livro: escritura.livro,
                folha: escritura.folha,
                outorgante: escritura.outorgante,
                outorgado: escritura.outorgado,
                escrevente: escritura.escrevente,
                tipo_livro: escritura.tipo_livro,
                mes: escritura.mes,
                ano: escritura.ano,
                observacao: escritura.observacao,
                integrity_hash: escritura.integrity_hash
            };

            const documentHash = crypto
                .createHash('sha256')
                .update(JSON.stringify(documentData))
                .digest('hex');

            // Assinar o hash com a chave privada
            const sign = crypto.createSign('RSA-SHA256');
            sign.update(documentHash);
            const signature = sign.sign(privateKey, 'hex');

            // Verificar se já existe assinatura
            const existing = db.prepare('SELECT id FROM assinaturas_digitais WHERE escritura_id = ? AND user_id = ?')
                .get(escrituraId, userId);

            if (existing) {
                // Atualizar assinatura existente
                const stmt = db.prepare(`
                    UPDATE assinaturas_digitais 
                    SET hash_documento = ?, assinatura = ?, timestamp = CURRENT_TIMESTAMP
                    WHERE escritura_id = ? AND user_id = ?
                `);
                stmt.run(documentHash, signature, escrituraId, userId);
            } else {
                // Criar nova assinatura
                const stmt = db.prepare(`
                    INSERT INTO assinaturas_digitais (escritura_id, user_id, hash_documento, assinatura)
                    VALUES (?, ?, ?, ?)
                `);
                stmt.run(escrituraId, userId, documentHash, signature);
            }

            return {
                success: true,
                documentHash,
                signature,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            throw new Error(`Erro ao assinar: ${error.message}`);
        }
    }

    // Verificar assinatura de uma escritura
    static verify(escrituraId, userId) {
        try {
            // Buscar assinatura
            const signature = db.prepare(`
                SELECT * FROM assinaturas_digitais 
                WHERE escritura_id = ? AND user_id = ?
            `).get(escrituraId, userId);

            if (!signature) {
                return { valid: false, reason: 'NO_SIGNATURE' };
            }

            // Buscar escritura
            const escritura = db.prepare('SELECT * FROM escrituras WHERE id = ?').get(escrituraId);
            if (!escritura) {
                return { valid: false, reason: 'ESCRITURA_NOT_FOUND' };
            }

            // Buscar chave pública do usuário
            const user = db.prepare('SELECT public_key, nome FROM users WHERE id = ?').get(userId);
            if (!user || !user.public_key) {
                return { valid: false, reason: 'NO_PUBLIC_KEY' };
            }

            // Recalcular hash do documento
            const documentData = {
                uuid: escritura.uuid,
                tipo: escritura.tipo,
                selagem: escritura.selagem,
                livro: escritura.livro,
                folha: escritura.folha,
                outorgante: escritura.outorgante,
                outorgado: escritura.outorgado,
                escrevente: escritura.escrevente,
                tipo_livro: escritura.tipo_livro,
                mes: escritura.mes,
                ano: escritura.ano,
                observacao: escritura.observacao,
                integrity_hash: escritura.integrity_hash
            };

            const currentHash = crypto
                .createHash('sha256')
                .update(JSON.stringify(documentData))
                .digest('hex');

            // Verificar se o hash mudou
            if (currentHash !== signature.hash_documento) {
                return {
                    valid: false,
                    reason: 'DOCUMENT_MODIFIED',
                    storedHash: signature.hash_documento,
                    currentHash
                };
            }

            // Verificar assinatura com chave pública
            const verify = crypto.createVerify('RSA-SHA256');
            verify.update(signature.hash_documento);
            const isValid = verify.verify(user.public_key, signature.assinatura, 'hex');

            return {
                valid: isValid,
                reason: isValid ? null : 'INVALID_SIGNATURE',
                signer: user.nome,
                timestamp: signature.timestamp,
                algorithm: signature.algoritmo
            };

        } catch (error) {
            return {
                valid: false,
                reason: 'VERIFICATION_ERROR',
                error: error.message
            };
        }
    }

    // Listar todas as assinaturas de uma escritura
    static getSignatures(escrituraId) {
        const signatures = db.prepare(`
            SELECT 
                a.*,
                u.nome as signer_name,
                u.email as signer_email
            FROM assinaturas_digitais a
            JOIN users u ON a.user_id = u.id
            WHERE a.escritura_id = ?
            ORDER BY a.timestamp DESC
        `).all(escrituraId);

        return signatures;
    }

    // Verificar todas as assinaturas de uma escritura
    static verifyAll(escrituraId) {
        const signatures = this.getSignatures(escrituraId);
        const results = [];

        for (const sig of signatures) {
            const verification = this.verify(escrituraId, sig.user_id);
            results.push({
                ...sig,
                verification
            });
        }

        return results;
    }
}

module.exports = DigitalSignature;
