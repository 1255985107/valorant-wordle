import json
from collections import Counter

def count_player_appearances():
    # 读取JSON文件
    with open('champions_part.txt.json', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 分割多个JSON对象
    json_parts = content.split('},{')
    
    # 处理分割后的每个部分
    for i in range(len(json_parts)):
        if i > 0:
            json_parts[i] = '{' + json_parts[i]
        if i < len(json_parts) - 1:
            json_parts[i] = json_parts[i] + '}'
    
    # 收集所有选手ID
    player_ids = []
    for part in json_parts:
        try:
            data = json.loads(part)
            if 'player_ids' in data:
                for player in data['player_ids']:
                    player_ids.append(player['name'])
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON: {e}")
            continue
    
    # 使用Counter统计出现次数
    appearances = Counter(player_ids)
    
    # 按出现次数降序排序
    sorted_appearances = dict(sorted(appearances.items(), key=lambda x: x[1], reverse=True))
    
    # 将结果保存到文件
    data = {}
    for player_name, count in sorted_appearances.items():
        data[player_name] = count
    with open('player_appearances.txt.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    
    print("统计结果已保存到 player_appearances.txt")

if __name__ == "__main__":
    count_player_appearances()