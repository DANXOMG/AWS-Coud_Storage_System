#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <openssl/evp.h>
#include <openssl/bio.h>
#include <openssl/buffer.h>

// Función para decodificar base64 (sin mostrar contenido)
unsigned char* base64_decode(const char* input, int* output_len) {
    BIO *bio, *b64;
    int decodeLen = strlen(input);
    unsigned char* buffer = (unsigned char*)malloc(decodeLen);
    memset(buffer, 0, decodeLen);

    bio = BIO_new_mem_buf(input, -1);
    b64 = BIO_new(BIO_f_base64());
    bio = BIO_push(b64, bio);

    BIO_set_flags(bio, BIO_FLAGS_BASE64_NO_NL); // No newlines
    *output_len = BIO_read(bio, buffer, decodeLen);
    BIO_free_all(bio);

    return buffer;
}

// Función para encriptar con AES-128-CBC
unsigned char* aes_encrypt(const unsigned char* plaintext, int plaintext_len, const unsigned char* key, const unsigned char* iv, int* ciphertext_len) {
    EVP_CIPHER_CTX *ctx;
    int len;
    int ciphertext_len_temp;
    unsigned char* ciphertext = (unsigned char*)malloc(plaintext_len + EVP_MAX_BLOCK_LENGTH);

    ctx = EVP_CIPHER_CTX_new();
    EVP_EncryptInit_ex(ctx, EVP_aes_128_cbc(), NULL, key, iv);

    EVP_EncryptUpdate(ctx, ciphertext, &len, plaintext, plaintext_len);
    ciphertext_len_temp = len;

    EVP_EncryptFinal_ex(ctx, ciphertext + len, &len);
    ciphertext_len_temp += len;

    EVP_CIPHER_CTX_free(ctx);

    *ciphertext_len = ciphertext_len_temp;
    return ciphertext;
}

// Función para desencriptar con AES-128-CBC
unsigned char* aes_decrypt(const unsigned char* ciphertext, int ciphertext_len, const unsigned char* key, const unsigned char* iv, int* plaintext_len) {
    EVP_CIPHER_CTX *ctx;
    int len;
    int plaintext_len_temp;
    unsigned char* plaintext = (unsigned char*)malloc(ciphertext_len);

    ctx = EVP_CIPHER_CTX_new();
    EVP_DecryptInit_ex(ctx, EVP_aes_128_cbc(), NULL, key, iv);

    EVP_DecryptUpdate(ctx, plaintext, &len, ciphertext, ciphertext_len);
    plaintext_len_temp = len;

    EVP_DecryptFinal_ex(ctx, plaintext + len, &len);
    plaintext_len_temp += len;

    EVP_CIPHER_CTX_free(ctx);

    *plaintext_len = plaintext_len_temp;
    return plaintext;
}

int main(int argc, char* argv[]) {
    if (argc != 2) {
        printf("Uso: %s <cadena_base64>\n", argv[0]);
        return 1;
    }

    const char* base64_input = argv[1];

    // Clave y IV fijos para el POC (en producción, usa claves seguras)
    unsigned char key[16] = "0123456789abcdef"; // 128 bits
    unsigned char iv[16] = "fedcba9876543210";  // 128 bits

    // Paso 1: Decodificar base64 (sin mostrar contenido)
    int decoded_len;
    unsigned char* decoded = base64_decode(base64_input, &decoded_len);
    if (decoded == NULL) {
        printf("Error al decodificar base64\n");
        return 1;
    }

    // Paso 2: Encriptar con AES
    int encrypted_len;
    unsigned char* encrypted = aes_encrypt(decoded, decoded_len, key, iv, &encrypted_len);
    if (encrypted == NULL) {
        printf("Error al encriptar\n");
        free(decoded);
        return 1;
    }

    // Paso 3: Desencriptar con AES
    int decrypted_len;
    unsigned char* decrypted = aes_decrypt(encrypted, encrypted_len, key, iv, &decrypted_len);
    if (decrypted == NULL) {
        printf("Error al desencriptar\n");
        free(decoded);
        free(encrypted);
        return 1;
    }

    // Verificar si la desencriptación coincide con el original (sin mostrar contenido)
    if (decoded_len == decrypted_len && memcmp(decoded, decrypted, decoded_len) == 0) {
        printf("POC exitoso: Encriptación y desencriptación completadas correctamente.\n");
        
        // Paso 4: Ejecutar la cadena desencriptada como comando (sin mostrar contenido)
        // Agregar un null terminator para que sea una cadena válida
        decrypted[decrypted_len] = '\0';
        int result = system((char*)decrypted);
        if (result == -1) {
            printf("Error al ejecutar el comando.\n");
        } else {
            printf("Comando ejecutado (código de salida: %d).\n", result);
        }
    } else {
        printf("Error: La desencriptación no coincide con el original.\n");
    }

    // Liberar memoria
    free(decoded);
    free(encrypted);
    free(decrypted);

    return 0;
}


// Compilar con gcc prueba.c -o prueba -lssl -lcrypto (Librería cripto para AES) 