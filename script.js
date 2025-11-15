/**
 * Yoroi Signature Tool - JavaScript
 * 
 * Công cụ tạo chữ ký cho Cardano Yoroi Wallet
 * Sử dụng cho Scavenger Mine allocation
 */

// ========================================
// Global Variables
// ========================================
let walletAPI = null;

// ========================================
// DOM Elements
// ========================================
const elements = {
    signBtn: document.getElementById('signBtn'),
    copyBtn: document.getElementById('copyBtn'),
    statusAlert: document.getElementById('statusAlert'),
    statusMessage: document.getElementById('statusMessage'),
    outputSection: document.getElementById('outputSection'),
    donateOutputWin: document.getElementById('donateOutputWin'),
    donorInput: document.getElementById('donorAddress'),
    recipientInput: document.getElementById('recipientAddress'),
    signatureForm: document.getElementById('signatureForm')
};

// ========================================
// Utility Functions
// ========================================

/**
 * Hiển thị thông báo trạng thái
 * @param {string} message - Nội dung thông báo
 * @param {string} type - Loại thông báo (success, danger, info)
 */
function showStatus(message, type) {
    console.log(`📢 showStatus() - Type: ${type}, Message:`, message);
    
    const { statusAlert, statusMessage } = elements;
    
    // Xóa tất cả class alert cũ
    statusAlert.classList.remove('alert-success', 'alert-danger', 'alert-info', 'd-none');
    
    // Thêm class alert mới
    statusAlert.classList.add(`alert-${type}`);
    statusMessage.innerHTML = message;
    statusAlert.classList.remove('d-none');

    console.log('  - ✅ Status alert đã được hiển thị');
}

/**
 * Ẩn thông báo trạng thái
 */
function hideStatus() {
    elements.statusAlert.classList.add('d-none');
}

/**
 * Validate địa chỉ Cardano
 * @param {string} address - Địa chỉ cần validate
 * @returns {boolean}
 */
function validateCardanoAddress(address) {
    console.log('🔍 validateCardanoAddress() được gọi với address:', address);
    
    // Địa chỉ Cardano bắt đầu bằng "addr1" và có độ dài khoảng 100+ ký tự
    const pattern = /^addr1[a-z0-9]{98,}$/i;
    const isValid = pattern.test(address);
    
    console.log('  - Pattern test result:', isValid);
    console.log('  - Address length:', address.length);
    
    return isValid;
}

/**
 * Chuyển đổi text sang hex
 * @param {string} text - Text cần chuyển đổi
 * @returns {string} - Chuỗi hex
 */
function textToHex(text) {
    console.log('🔢 textToHex() được gọi với text:', text);
    
    const hex = Array.from(new TextEncoder().encode(text))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    
    console.log('  - Converted to hex:', hex);
    console.log('  - Hex length:', hex.length);
    
    return hex;
}

/**
 * Thêm loading state cho button
 * @param {HTMLElement} button - Button element
 * @param {boolean} isLoading - Trạng thái loading
 */
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
    } else {
        button.disabled = false;
        button.classList.remove('loading');
    }
}

// ========================================
// Main Functions
// ========================================

/**
 * Xử lý việc ký chữ ký với Yoroi Wallet
 */
async function handleSignature() {
    console.log('=== BẮT ĐẦU QUÁ TRÌNH KÝ ===');
    
    const donorAddr = elements.donorInput.value.trim();
    const recipientAddr = elements.recipientInput.value.trim();

    console.log('📥 Input nhận được:');
    console.log('  - Donor Address:', donorAddr);
    console.log('  - Recipient Address:', recipientAddr);

    // Validate inputs
    if (!donorAddr || !recipientAddr) {
        console.warn('⚠️ Thiếu thông tin: Một hoặc cả hai địa chỉ đang trống');
        showStatus(
            '<i class="fas fa-exclamation-circle me-2"></i>Vui lòng nhập đầy đủ địa chỉ Donor và Recipient.',
            'danger'
        );
        return;
    }

    // Validate Cardano addresses
    console.log('🔍 Đang validate địa chỉ Cardano...');
    
    if (!validateCardanoAddress(donorAddr)) {
        console.error('❌ Địa chỉ Donor không hợp lệ:', donorAddr);
        showStatus(
            '<i class="fas fa-exclamation-circle me-2"></i>Địa chỉ Donor không hợp lệ. Vui lòng kiểm tra lại.',
            'danger'
        );
        return;
    }
    console.log('✅ Địa chỉ Donor hợp lệ');

    if (!validateCardanoAddress(recipientAddr)) {
        console.error('❌ Địa chỉ Recipient không hợp lệ:', recipientAddr);
        showStatus(
            '<i class="fas fa-exclamation-circle me-2"></i>Địa chỉ Recipient không hợp lệ. Vui lòng kiểm tra lại.',
            'danger'
        );
        return;
    }
    console.log('✅ Địa chỉ Recipient hợp lệ');

    try {
        // Hiển thị trạng thái đang xử lý
        showStatus(
            '<i class="fas fa-spinner fa-spin me-2"></i>Đang kết nối với Yoroi Wallet...',
            'info'
        );
        setButtonLoading(elements.signBtn, true);

        // Kiểm tra Yoroi Wallet
        console.log('🔍 Đang kiểm tra Yoroi Wallet...');
        
        if (!window.cardano) {
            console.error('❌ window.cardano không tồn tại');
            throw new Error('Yoroi Wallet chưa được cài đặt hoặc chưa được bật.');
        }
        console.log('✅ window.cardano tồn tại');
        
        if (!window.cardano.yoroi) {
            console.error('❌ window.cardano.yoroi không tồn tại');
            throw new Error('Yoroi Wallet chưa được cài đặt hoặc chưa được bật.');
        }
        console.log('✅ window.cardano.yoroi tồn tại');

        // Kết nối với Yoroi Wallet
        console.log('🔗 Đang kết nối với Yoroi Wallet API...');
        walletAPI = await window.cardano.yoroi.enable();
        console.log('✅ Đã kết nối Yoroi Wallet API thành công!');
        console.log('  - Wallet API object:', walletAPI);
        
        showStatus(
            '<i class="fas fa-spinner fa-spin me-2"></i>Đang tạo chữ ký...',
            'info'
        );

        // Tạo message cần ký
        const message = `Assign accumulated Scavenger rights to: ${recipientAddr}`;
        console.log('📝 Message cần ký:', message);
        
        const hexMessage = textToHex(message);
        console.log('🔢 Message dạng Hex:', hexMessage);
        console.log('  - Độ dài Hex:', hexMessage.length, 'characters');

        // Ký message
        console.log('✍️ Đang gọi walletAPI.signData()...');
        console.log('  - Address:', donorAddr);
        console.log('  - Hex Message:', hexMessage);
        
        let signature;
        try {
            signature = await walletAPI.signData(donorAddr, hexMessage);
            console.log('✅ Đã nhận được chữ ký thành công!');
            console.log('  - Signature object:', signature);
            console.log('  - Signature value:', signature.signature);
            console.log('  - Signature length:', signature.signature.length, 'characters');
        } catch (signError) {
            console.error('❌ Lỗi khi ký message:', signError);
            
            // Xử lý các loại lỗi cụ thể
            if (signError.info && signError.info.includes('address not found')) {
                throw new Error('Địa chỉ Donor không tồn tại trong ví Yoroi của bạn. Vui lòng kiểm tra lại địa chỉ hoặc chọn địa chỉ đúng từ ví.');
            } else if (signError.code === 2) {
                throw new Error('Người dùng đã từ chối ký. Vui lòng chấp nhận yêu cầu ký từ Yoroi Wallet.');
            } else {
                throw new Error(signError.info || signError.message || 'Không thể ký message. Vui lòng thử lại.');
            }
        }

        // Tạo cURL command
        console.log('🔧 Đang tạo cURL command...');
        const curlCommand = generateCurlCommand(recipientAddr, donorAddr, signature.signature);
        console.log('✅ cURL command đã được tạo');
        console.log('  - Command:', curlCommand);

        // Hiển thị kết quả
        console.log('📤 Đang hiển thị kết quả lên UI...');
        displayResult(curlCommand);

        // Hiển thị thông báo thành công
        showStatus(
            '<i class="fas fa-check-circle me-2"></i>Tạo chữ ký thành công!',
            'success'
        );
        
        console.log('🎉 QUÁ TRÌNH KÝ HOÀN TẤT THÀNH CÔNG!');
        console.log('=== KẾT THÚC ===');

    } catch (error) {
        console.error('❌ LỖI XẢY RA:');
        console.error('  - Error object:', error);
        console.error('  - Error message:', error.message);
        console.error('  - Error info:', error.info);
        console.error('  - Error code:', error.code);
        console.error('  - Error stack:', error.stack);
        
        let errorMessage = 'Đã xảy ra lỗi không xác định.';
        
        // Xử lý các loại lỗi cụ thể
        if (error.message.includes('Địa chỉ Donor không tồn tại')) {
            errorMessage = error.message;
        } else if (error.message.includes('từ chối ký')) {
            errorMessage = error.message;
        } else if (error.message.includes('Yoroi Wallet')) {
            errorMessage = 'Vui lòng cài đặt và mở Yoroi Wallet extension.';
        } else if (error.info) {
            // Xử lý error.info từ Yoroi
            if (error.info.includes('address not found')) {
                errorMessage = 'Địa chỉ Donor không tồn tại trong ví Yoroi của bạn. Vui lòng kiểm tra lại địa chỉ.';
            } else {
                errorMessage = error.info;
            }
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        console.error('📢 Hiển thị lỗi cho người dùng:', errorMessage);
        
        showStatus(
            `<i class="fas fa-times-circle me-2"></i><strong>Lỗi:</strong> ${errorMessage}`,
            'danger'
        );
        
        console.log('=== KẾT THÚC VỚI LỖI ===');
    } finally {
        setButtonLoading(elements.signBtn, false);
    }
}

/**
 * Tạo cURL command
 * @param {string} recipientAddr - Địa chỉ người nhận
 * @param {string} donorAddr - Địa chỉ người cho
 * @param {string} signature - Chữ ký
 * @returns {string} - cURL command
 */
function generateCurlCommand(recipientAddr, donorAddr, signature) {
    console.log('📦 generateCurlCommand() được gọi với:');
    console.log('  - recipientAddr:', recipientAddr);
    console.log('  - donorAddr:', donorAddr);
    console.log('  - signature:', signature);
    
    const url = `https://scavenger.prod.gd.midnighttge.io/donate_to/${recipientAddr}/${donorAddr}/${signature}`;
    const command = `curl -L -X POST "${url}" -d "{}"`;
    
    console.log('  - Generated URL:', url);
    console.log('  - Generated Command:', command);
    
    return command;
}

/**
 * Hiển thị kết quả
 * @param {string} command - Command cần hiển thị
 */
function displayResult(command) {
    console.log('🖥️ displayResult() được gọi');
    console.log('  - Command to display:', command);
    
    elements.donateOutputWin.textContent = command;
    elements.outputSection.classList.remove('d-none');
    
    console.log('  - ✅ Output section đã hiển thị');
    
    // Scroll to output section
    setTimeout(() => {
        console.log('  - 📜 Đang scroll tới output section...');
        elements.outputSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }, 100);
}

/**
 * Copy command vào clipboard
 */
async function copyToClipboard() {
    console.log('📋 copyToClipboard() được gọi');
    
    const text = elements.donateOutputWin.textContent;
    console.log('  - Text to copy:', text);
    console.log('  - Text length:', text.length, 'characters');
    
    try {
        await navigator.clipboard.writeText(text);
        console.log('  - ✅ Copy thành công vào clipboard!');
        
        // Thay đổi text button tạm thời
        const originalHTML = elements.copyBtn.innerHTML;
        elements.copyBtn.innerHTML = '<i class="fas fa-check me-2"></i>Đã copy!';
        elements.copyBtn.classList.remove('btn-secondary');
        elements.copyBtn.classList.add('btn-success');
        
        console.log('  - ✅ Button UI đã được cập nhật');
        
        setTimeout(() => {
            elements.copyBtn.innerHTML = originalHTML;
            elements.copyBtn.classList.remove('btn-success');
            elements.copyBtn.classList.add('btn-secondary');
            console.log('  - 🔄 Button UI đã được reset về trạng thái ban đầu');
        }, 2000);
        
    } catch (err) {
        console.error('❌ Copy error:', err);
        console.error('  - Error message:', err.message);
        showStatus(
            '<i class="fas fa-exclamation-circle me-2"></i>Không thể copy. Vui lòng copy thủ công.',
            'danger'
        );
    }
}

// ========================================
// Event Listeners
// ========================================

/**
 * Xử lý submit form
 */
elements.signatureForm.addEventListener('submit', (e) => {
    console.log('📝 Form submit event triggered');
    e.preventDefault();
    handleSignature();
});

/**
 * Xử lý click copy button
 */
elements.copyBtn.addEventListener('click', () => {
    console.log('🖱️ Copy button clicked');
    copyToClipboard();
});

/**
 * Xử lý Enter key trong input fields
 */
[elements.donorInput, elements.recipientInput].forEach((input, index) => {
    const fieldName = index === 0 ? 'Donor' : 'Recipient';
    console.log(`⌨️ Setting up Enter key listener for ${fieldName} input`);
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log(`↵ Enter key pressed in ${fieldName} field`);
            e.preventDefault();
            handleSignature();
        }
    });
});

// ========================================
// Initialization
// ========================================

/**
 * Đợi Yoroi Wallet được inject vào trang
 */
async function waitForYoroi(maxAttempts = 10, delay = 500) {
    console.log('⏳ Đang chờ Yoroi Wallet được inject...');
    
    for (let i = 0; i < maxAttempts; i++) {
        console.log(`  - Lần thử ${i + 1}/${maxAttempts}...`);
        
        if (window.cardano && window.cardano.yoroi) {
            console.log('✅ Yoroi Wallet đã được inject thành công!');
            return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    console.error('❌ Timeout: Không thể tìm thấy Yoroi Wallet sau', maxAttempts, 'lần thử');
    return false;
}

/**
 * Khởi tạo ứng dụng
 */
async function init() {
    console.log('🚀 ===== YOROI SIGNATURE TOOL STARTING =====');
    console.log('📅 Timestamp:', new Date().toLocaleString('vi-VN'));
    console.log('🌐 User Agent:', navigator.userAgent);
    console.log('🌍 Location:', window.location.href);
    console.log('🔧 Đang khởi tạo ứng dụng...');
    
    // Kiểm tra Yoroi Wallet ngay khi load
    console.log('🔍 Đang kiểm tra Yoroi Wallet...');
    
    if (!window.cardano) {
        console.warn('⚠️ window.cardano không tồn tại - Đang chờ Yoroi inject...');
        
        // Chờ Yoroi được inject
        const yoroiFound = await waitForYoroi();
        
        if (!yoroiFound) {
            console.error('❌ Yoroi Wallet không được tìm thấy');
            showStatus(
                '<i class="fas fa-exclamation-triangle me-2"></i><strong>Cảnh báo:</strong> Yoroi Wallet chưa được cài đặt hoặc chưa được bật. <br><small>Vui lòng cài đặt extension và refresh trang.</small>',
                'danger'
            );
            return;
        }
    } else {
        console.log('✅ window.cardano tồn tại');
        
        if (!window.cardano.yoroi) {
            console.warn('⚠️ window.cardano.yoroi không tồn tại - Đang chờ...');
            
            const yoroiFound = await waitForYoroi();
            
            if (!yoroiFound) {
                console.error('❌ window.cardano.yoroi không được phát hiện');
                showStatus(
                    '<i class="fas fa-exclamation-triangle me-2"></i><strong>Cảnh báo:</strong> Yoroi Wallet chưa được phát hiện. <br><small>Hãy đảm bảo extension đã được cài đặt và bật.</small>',
                    'danger'
                );
                return;
            }
        } else {
            console.log('✅ window.cardano.yoroi tồn tại');
            console.log('📦 Yoroi object:', window.cardano.yoroi);
            console.log('🎉 Yoroi Wallet đã sẵn sàng!');
        }
    }
    
    // Kiểm tra DOM elements
    console.log('🔍 Đang kiểm tra DOM elements...');
    let allElementsFound = true;
    
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            console.log(`  ✅ ${key} - Found`);
        } else {
            console.error(`  ❌ ${key} - NOT FOUND`);
            allElementsFound = false;
        }
    });
    
    if (allElementsFound) {
        console.log('✅ Tất cả DOM elements đã được tìm thấy');
    } else {
        console.error('❌ Một số DOM elements không tồn tại!');
    }
    
    console.log('✅ Khởi tạo hoàn tất!');
    console.log('🎯 Yoroi Signature Tool đã sẵn sàng sử dụng');
    console.log('=========================================');
}

// Chạy init khi DOM đã load xong
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}