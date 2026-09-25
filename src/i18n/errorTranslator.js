import { useLanguageStore } from "../store/languageStore";

const ERROR_DICTIONARY = [
  // Authentication & Login
  {
    pattern: /invalid username or password/i,
    vi: "Tên đăng nhập hoặc mật khẩu không chính xác",
    en: "Invalid username or password",
  },
  {
    pattern: /username and password must not be empty/i,
    vi: "Tên đăng nhập và mật khẩu không được để trống",
    en: "Username and password must not be empty",
  },
  {
    pattern: /account has been deactivated.*contact.*administrator/i,
    vi: "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.",
    en: "Account has been deactivated. Please contact the administrator.",
  },
  {
    pattern: /account is temporarily locked due to excessive failed attempts.*after (\d+) minutes/i,
    vi: (m) => `Tài khoản đang bị tạm khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau ${m[1]} phút.`,
    en: (m) => `Account is temporarily locked due to excessive failed attempts. Please try again after ${m[1]} minutes.`,
  },
  {
    pattern: /account has been temporarily locked for (\d+) minutes due to (\d+) consecutive failed login attempts/i,
    vi: (m) => `Tài khoản đã bị tạm khóa ${m[1]} phút do nhập sai mật khẩu ${m[2]} lần liên tiếp.`,
    en: (m) => `Account has been temporarily locked for ${m[1]} minutes due to ${m[2]} consecutive failed login attempts.`,
  },
  {
    pattern: /invalid password.*you have (\d+) attempts remaining/i,
    vi: (m) => `Mật khẩu không chính xác. Bạn còn ${m[1]} lần thử trước khi tài khoản bị khóa tạm thời.`,
    en: (m) => `Invalid password. You have ${m[1]} attempts remaining before temporary lockout.`,
  },
  {
    pattern: /login successful/i,
    vi: "Đăng nhập thành công",
    en: "Login successful",
  },
  {
    pattern: /login failed/i,
    vi: "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
    en: "Login failed. Please check your credentials.",
  },

  // Password & Reset
  {
    pattern: /incorrect old password/i,
    vi: "Mật khẩu cũ không chính xác",
    en: "Incorrect old password",
  },
  {
    pattern: /password changed successfully/i,
    vi: "Đổi mật khẩu thành công",
    en: "Password changed successfully",
  },
  {
    pattern: /failed to change password/i,
    vi: "Đổi mật khẩu thất bại",
    en: "Failed to change password",
  },
  {
    pattern: /password information is required|password is required/i,
    vi: "Vui lòng nhập mật khẩu",
    en: "Password is required",
  },
  {
    pattern: /username, email and new password are required/i,
    vi: "Vui lòng nhập đầy đủ tên tài khoản, email và mật khẩu mới",
    en: "Username, email and new password are required",
  },
  {
    pattern: /invalid username or registered email|invalid username or email/i,
    vi: "Thông tin tài khoản hoặc email đăng ký không chính xác",
    en: "Invalid username or registered email",
  },
  {
    pattern: /password reset successfully/i,
    vi: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.",
    en: "Password reset successfully. Please sign in with your new password.",
  },

  // Users Management
  {
    pattern: /user not found/i,
    vi: "Không tìm thấy người dùng",
    en: "User not found",
  },
  {
    pattern: /user deleted successfully/i,
    vi: "Xóa người dùng thành công",
    en: "User deleted successfully",
  },
  {
    pattern: /user activated successfully/i,
    vi: "Kích hoạt người dùng thành công",
    en: "User activated successfully",
  },
  {
    pattern: /user deactivated successfully/i,
    vi: "Vô hiệu hóa người dùng thành công",
    en: "User deactivated successfully",
  },
  {
    pattern: /user created successfully/i,
    vi: "Tạo người dùng thành công",
    en: "User created successfully",
  },
  {
    pattern: /user updated successfully/i,
    vi: "Cập nhật người dùng thành công",
    en: "User updated successfully",
  },
  {
    pattern: /failed to save user/i,
    vi: "Lưu thông tin người dùng thất bại",
    en: "Failed to save user",
  },
  {
    pattern: /failed to delete user/i,
    vi: "Xóa người dùng thất bại",
    en: "Failed to delete user",
  },
  {
    pattern: /failed to update user status/i,
    vi: "Cập nhật trạng thái người dùng thất bại",
    en: "Failed to update user status",
  },

  // Accounts & Connections
  {
    pattern: /account host\/ip is required/i,
    vi: "Địa chỉ IP/Host của tài khoản không được để trống",
    en: "Account host/IP is required",
  },
  {
    pattern: /account port is required/i,
    vi: "Cổng kết nối (Port) của tài khoản không được để trống",
    en: "Account port is required",
  },
  {
    pattern: /account_name is required|account name is required/i,
    vi: "Tên tài khoản không được để trống",
    en: "Account name is required",
  },
  {
    pattern: /account_name already exists|account name already exists/i,
    vi: "Tên tài khoản đã tồn tại trong hệ thống",
    en: "Account name already exists",
  },
  {
    pattern: /host is required/i,
    vi: "Địa chỉ máy chủ (Host) không được để trống",
    en: "Host is required",
  },
  {
    pattern: /username is required/i,
    vi: "Tên đăng nhập không được để trống",
    en: "Username is required",
  },
  {
    pattern: /password is required/i,
    vi: "Mật khẩu không được để trống",
    en: "Password is required",
  },
  {
    pattern: /username and password are required/i,
    vi: "Tên đăng nhập và mật khẩu không được để trống",
    en: "Username and password are required",
  },
  {
    pattern: /port is required/i,
    vi: "Cổng kết nối không được để trống",
    en: "Port is required",
  },
  {
    pattern: /cannot connect to host.*timeout/i,
    vi: (m) => `Không thể kết nối tới máy chủ (Hết thời gian chờ)`,
    en: (m) => `Cannot connect to host (Connection timeout)`,
  },
  {
    pattern: /socket connected to node.*successfully/i,
    vi: "Kết nối Socket tới Node mạng thành công!",
    en: "Socket connected to node successfully!",
  },
  {
    pattern: /account created successfully/i,
    vi: "Tạo tài khoản kết nối thành công",
    en: "Account created successfully",
  },
  {
    pattern: /account updated successfully/i,
    vi: "Cập nhật tài khoản kết nối thành công",
    en: "Account updated successfully",
  },
  {
    pattern: /account deleted successfully/i,
    vi: "Xóa tài khoản kết nối thành công",
    en: "Account deleted successfully",
  },
  {
    pattern: /username already exists/i,
    vi: "Tên đăng nhập đã tồn tại trong hệ thống",
    en: "Username already exists",
  },
  {
    pattern: /email already exists/i,
    vi: "Địa chỉ Email đã tồn tại trong hệ thống",
    en: "Email already exists",
  },
  {
    pattern: /invalid email format/i,
    vi: "Định dạng Email không hợp lệ",
    en: "Invalid email format",
  },
  {
    pattern: /full name is required/i,
    vi: "Họ và tên không được để trống",
    en: "Full name is required",
  },
  {
    pattern: /username must be between 3 and 50 characters/i,
    vi: "Tên đăng nhập phải có từ 3 đến 50 ký tự",
    en: "Username must be between 3 and 50 characters",
  },
  {
    pattern: /password must be at least 6 characters/i,
    vi: "Mật khẩu phải có ít nhất 6 ký tự",
    en: "Password must be at least 6 characters",
  },

  // Routing Management
  {
    pattern: /direction is required/i,
    vi: "Chiều định tuyến không được để trống (IN/OUT)",
    en: "Direction is required (IN/OUT)",
  },
  {
    pattern: /receive topic is required.*in direction|receive topic cannot be blank/i,
    vi: "Topic nhận không được để trống đối với chiều IN (SWIM → AMHS)",
    en: "Receive topic is required for IN direction",
  },
  {
    pattern: /send topic is required.*out direction|send topic cannot be blank/i,
    vi: "Topic phát không được để trống đối với chiều OUT (AMHS → SWIM)",
    en: "Send topic is required for OUT direction",
  },
  // Config & Validation
  {
    pattern: /must be an integer/i,
    vi: "Giá trị phải là số nguyên",
    en: "Value must be an integer",
  },
  {
    pattern: /invalid aftn address format/i,
    vi: "Địa chỉ AFTN không hợp lệ (yêu cầu 8 ký tự chữ cái, ví dụ: VVNBZTZX)",
    en: "Invalid AFTN address format (must be 8 alphabetic characters, e.g. VVNBZTZX)",
  },
  {
    pattern: /recipients.*required.*out direction|recipients cannot be blank/i,
    vi: "Danh sách địa chỉ nhận không được để trống",
    en: "Recipients are required",
  },
  {
    pattern: /routing created successfully/i,
    vi: "Tạo cấu hình định tuyến thành công",
    en: "Routing created successfully",
  },
  {
    pattern: /routing updated successfully/i,
    vi: "Cập nhật cấu hình định tuyến thành công",
    en: "Routing updated successfully",
  },
  {
    pattern: /routing deleted successfully/i,
    vi: "Xóa cấu hình định tuyến thành công",
    en: "Routing deleted successfully",
  },

  // Unrouted Messages Actions
  {
    pattern: /originator is required/i,
    vi: "Địa chỉ nơi gửi (Originator) không được để trống",
    en: "Originator is required",
  },
  {
    pattern: /originator must be 8 uppercase letters/i,
    vi: "Địa chỉ nơi gửi phải gồm đúng 8 chữ cái viết hoa (A-Z)",
    en: "Originator must be 8 uppercase letters",
  },
  {
    pattern: /recipients are required/i,
    vi: "Địa chỉ nơi nhận không được để trống",
    en: "Recipients are required",
  },
  {
    pattern: /reject reason is required|please provide a reason for rejecting/i,
    vi: "Vui lòng nhập lý do từ chối điện văn",
    en: "Reject reason is required",
  },
  {
    pattern: /message manually routed successfully/i,
    vi: "Định tuyến thủ công điện văn thành công",
    en: "Message manually routed successfully",
  },
  {
    pattern: /message rejected successfully/i,
    vi: "Từ chối điện văn thành công",
    en: "Message rejected successfully",
  },

  // Generic & Network
  {
    pattern: /network error/i,
    vi: "Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền.",
    en: "Network error. Please check your connection.",
  },
  {
    pattern: /cannot connect to gateway api/i,
    vi: "Không thể kết nối đến Gateway API",
    en: "Cannot connect to Gateway API",
  },
  {
    pattern: /unauthorized|invalid or expired token/i,
    vi: "Phiên làm việc không hợp lệ hoặc đã hết hạn",
    en: "Unauthorized or session expired",
  },
  {
    pattern: /forbidden|you do not have permission/i,
    vi: "Bạn không có quyền thực hiện thao tác này",
    en: "You do not have permission to perform this action",
  },
  {
    pattern: /internal server error/i,
    vi: "Lỗi hệ thống máy chủ. Vui lòng thử lại sau.",
    en: "Internal server error. Please try again later.",
  },
  {
    pattern: /api request failed/i,
    vi: "Yêu cầu xử lý thất bại",
    en: "API request failed",
  },
];

/**
 * Dịch thông báo lỗi hoặc thông điệp phản hồi từ API theo ngôn ngữ hiện tại của ứng dụng.
 * @param {string|Error} errorInput Thông điệp lỗi dạng string hoặc đối tượng Error.
 * @param {string} [forcedLang] Ngôn ngữ ép buộc ('vi' hoặc 'en'), mặc định lấy từ useLanguageStore.
 * @returns {string} Thông điệp đã được bản địa hóa.
 */
export function translateApiMessage(errorInput, forcedLang) {
  if (!errorInput) return "";

  const lang = forcedLang || (useLanguageStore.getState().language?.split("-")[0] || "vi");

  let rawMessage = "";
  if (typeof errorInput === "string") {
    rawMessage = errorInput;
  } else if (errorInput?.response?.data?.message) {
    rawMessage = errorInput.response.data.message;
  } else if (errorInput?.response?.data?.error) {
    rawMessage = errorInput.response.data.error;
  } else if (errorInput?.message) {
    rawMessage = errorInput.message;
  } else {
    rawMessage = String(errorInput);
  }

  const trimmed = rawMessage.trim();
  if (!trimmed) return "";

  for (const item of ERROR_DICTIONARY) {
    const match = trimmed.match(item.pattern);
    if (match) {
      const val = item[lang] || item["en"] || item["vi"];
      return typeof val === "function" ? val(match) : val;
    }
  }

  // Nếu không khớp từ điển cụ thể, trả về thông điệp gốc
  return trimmed;
}

export default translateApiMessage;
