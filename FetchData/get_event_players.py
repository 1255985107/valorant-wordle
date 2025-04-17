import requests
import json
import time

def get_event_players(event_id):
    # API endpoint
    api_url = f"https://statsvlr.nostep.xyz/api/v1/players"
    
    # 设置请求头
    headers = {
        'User-Agent': 'ValorantEventLookup/1.0',
        'Accept': 'application/json'
    }
    
    # 设置查询参数
    params = {
        'event': event_id,
        'limit': 'all',
        'minrounds': '1', # 比赛中场次较少，降低 min rounds
        'timespan': 'all'
    }
    
    try:
        # 发送 GET 请求
        response = requests.get(api_url, headers=headers, params=params)
        response.raise_for_status()
        time.sleep(0.5)  # 添加延时以避免频繁请求
        
        # 解析响应数据
        data = response.json()
        
        # 提取选手ID
        player_ids = []
        if 'data' in data:
            for player in data['data']:
                player_ids.append({
                    "id": player['id'],
                    "name": player['name'],
                })
        
        # 构建输出数据结构
        output_data = {
            "event_id": event_id,
            "size": len(player_ids),
            "player_ids": player_ids
        }
        
        return output_data
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

def process_all_events():
    try:
        # 读取比赛数据
        with open("ChampionTour.txt.json", "r", encoding="utf-8") as f:
            events_data = json.load(f)
        
        if not events_data.get('data'):
            print("未找到比赛数据")
            return
        
        # 处理每个比赛
        total_events = len(events_data['data'])
        with open("champions_part.txt.json", "w+", encoding="utf-8") as f:
            f.write("[")
        for index, event in enumerate(events_data['data'], 1):
            event_id = event['id']
            event_name = event['name']
            print(f"\n处理比赛 {event_id} ({index}/{total_events}): {event_name}")

            result = get_event_players(event_id)
            if result:
                print(f"成功获取 {result['size']} 名选手数据")
                with open("champions_part.txt.json", "a", encoding="utf-8") as f:
                    json.dump(result, f, ensure_ascii=False, indent=4)
                    if index < total_events:
                        f.write(",")
            else:
                print(f"获取选手数据失败")
            time.sleep(1)
        with open("champions_part.txt.json", "a", encoding="utf-8") as f:
            f.write("]")
    except FileNotFoundError:
        print("未找到 ChampionTour.txt.json 文件")
    except json.JSONDecodeError:
        print("JSON 文件格式错误")
    except Exception as e:
        print(f"处理过程中出现错误: {e}")

def main():
    # 修改 main 函数
    import sys
    if len(sys.argv) == 1:
        print("正在处理所有比赛...")
        process_all_events()
    elif len(sys.argv) == 2:
        event_id = sys.argv[1]
        print(f"正在处理单个比赛 ID: {event_id}")
        result = get_event_players(event_id)
        output_filename = f"{event_id}_part.json"
        with open(output_filename, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=4)
        print(f"已保存 {result['size']} 个选手ID到 {output_filename}")
    else:
        print("Usage: python get_event_players.py [event_id]")
        print("如果不提供 event_id，将处理所有比赛")

if __name__ == "__main__":
    main()