import requests
import json
from datetime import datetime
import time  # 添加此行

def get_champions_events(page=1):
    # API endpoint
    api_url = f"https://statsvlr.nostep.xyz/api/v1/events?page={page}&status=completed&region=all"
    
    # 设置请求头
    headers = {
        'User-Agent': 'ValorantEventLookup/1.0',
        'Accept': 'application/json'
    }
    
    try:
        # 发送 GET 请求
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()
        time.sleep(0.5)  # 添加1秒延时
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

def filter_champions_events(events):
    filtered_events = []
    
    for event in events:
        name = event['name'].lower()
        id = int(event['id'])
        # 检查是否为大师赛或冠军赛
        is_masters = ("champions tour" in name and "masters" in name) or \
                    ("champions tour" in name and "lock//in" in name)
        is_champions = "valorant champions" in name and "championship" not in name
        
        if id >= 353 and (is_masters or is_champions):
            # 排除其他类型赛事
            if not any(keyword in name for keyword in ['ascension', 'kickoff', 'qualifier', 'college', 'spring', 'fall']):
                filtered_events.append(event)
    return filtered_events

def main():
    all_events = []
    page = 1
    
    # 获取所有页面的数据
    while True:
        data = get_champions_events(page)
        if not data or 'data' not in data or not data['data']:
            break
            
        all_events.extend(data['data'])
        page += 1
    
    # 筛选符合条件的赛事
    filtered_events = filter_champions_events(all_events)
    
    # 构建输出数据结构
    output_data = {
        "status": "OK",
        "size": len(filtered_events),
        "data": filtered_events
    }
    
    # 保存到文件
    with open("ChampionTour.txt.json", "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=4)
    
    print(f"已保存 {len(filtered_events)} 个赛事信息到 ChampionTour.txt.json")

if __name__ == "__main__":
    main()