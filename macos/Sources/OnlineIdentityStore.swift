import Foundation
import Security

struct OnlineIdentityStore {
    private let service = "local.navalwar.mac.online"
    private var account: String { ProcessInfo.processInfo.environment["NAVAL_WAR_TEST_KEYCHAIN_ACCOUNT"] ?? "last-session" }
    private var query: [String: Any] { [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: account] }
    func exists() -> Bool { SecItemCopyMatching(query as CFDictionary, nil) == errSecSuccess }
    func save(_ identity: OnlineIdentity) throws {
        let data = try JSONEncoder().encode(identity)
        let status = SecItemUpdate(query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if status == errSecItemNotFound {
            var item = query
            item[kSecValueData as String] = data
            item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
            try check(SecItemAdd(item as CFDictionary, nil))
        } else { try check(status) }
    }
    func load() throws -> OnlineIdentity {
        var request = query; request[kSecReturnData as String] = true; request[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        try check(SecItemCopyMatching(request as CFDictionary, &result))
        guard let data = result as? Data else { throw NavalError(message: "Online session credential is missing.") }
        return try JSONDecoder().decode(OnlineIdentity.self, from: data)
    }
    func clear() throws {
        let status = SecItemDelete(query as CFDictionary)
        if status != errSecItemNotFound { try check(status) }
    }
    private func check(_ status: OSStatus) throws {
        guard status == errSecSuccess else { throw NavalError(message: "Could not access the saved online session in Keychain (\(status)).") }
    }
}
