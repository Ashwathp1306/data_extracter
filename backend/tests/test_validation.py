import pytest
from app.utils.excel import extract_username

def test_extract_username_leetcode():
    assert extract_username("https://leetcode.com/ashwath", "leetcode") == "ashwath"
    assert extract_username("https://leetcode.com/ashwath/", "leetcode") == "ashwath"
    assert extract_username("ashwath", "leetcode") == "ashwath"
    assert extract_username("invalid url", "leetcode") == None

def test_extract_username_github():
    assert extract_username("https://github.com/ashwath", "github") == "ashwath"
    assert extract_username("https://github.com/ashwath/", "github") == "ashwath"
    assert extract_username("ashwath", "github") == "ashwath"
    assert extract_username("invalid url", "github") == None
