#[cfg(test)]
mod tests {
    use std::fs;
    use std::io::Write;
    use super::super::commands::read_pdf_bytes;

    #[test]
    fn test_read_pdf_bytes_returns_response() {
        // 创建一个临时测试文件
        let temp_path = "/tmp/test_pdf_bytes.txt";
        {
            let mut file = fs::File::create(temp_path).unwrap();
            file.write_all(b"hello pdf bytes").unwrap();
        }

        let response = read_pdf_bytes(temp_path.to_string());
        assert!(response.is_ok(), "read_pdf_bytes should succeed");

        // 清理
        fs::remove_file(temp_path).unwrap();
    }
}
