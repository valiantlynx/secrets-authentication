# Secrets-authentication
security levels

level 1 - simple username and password where password is stored as plain text

level 2 - encryption where you encrypt the stored password while in the database, decrypting to check. keys are stored in an .envfile that gets gitignored

level 3 - hashing the password while in the database and just comparing the hashes to check
