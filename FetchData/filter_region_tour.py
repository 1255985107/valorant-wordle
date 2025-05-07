import requests
import json
from datetime import datetime
import time  # 添加此行

def get_champions_events(page=1):
    # API endpoint
    api_url = f"http://localhost:5000/api/v1/events"
    
    # 设置请求头
    headers = {
        'User-Agent': 'ValorantEventLookup/1.0',
        'Accept': 'application/json'
    }

    params = {
        'page': page,
        'region': 'all',
        'status': 'completed'
    }
    
    try:
        # 发送 GET 请求
        response = requests.get(api_url, headers=headers, params=params)
        response.raise_for_status()
        time.sleep(0.3)  # 添加0.3秒延时
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

def filter_region_events(events):
    filtered_events = [None] * 4
    regions = ["China", "Americas", "Pacific", "EMEA"]
    
    for event in events:
        name = event['name'].lower()
        id = int(event['id'])
        for idx in range(4):
            if filtered_events[idx] == None or id > int(filtered_events[idx]['id']):
                if regions[idx].lower() in name and "champions tour" in name:
                    filtered_events[idx] = {
                        **event,
                        'region': regions[idx]
                    }
                    break
    return filtered_events

def main():
    all_events = []
    page = 1
    
    # 获取所有页面的数据
    while page < 5:
        data = get_champions_events(page)
        if not data or 'data' not in data or not data['data']:
            break
            
        all_events.extend(data['data'])
        page += 1
    
    # 筛选符合条件的赛事
    filtered_events = filter_region_events(all_events)
    
    # 构建输出数据结构
    output_data = {
        "status": "OK",
        "size": len(filtered_events),
        "data": filtered_events
    }
    
    # 保存到文件
    with open("RegionTour.txt.json", "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=4)
    
    print(f"已保存 {len(filtered_events)} 个赛事信息到 RegionTour.txt.json")

if __name__ == "__main__":
    main()