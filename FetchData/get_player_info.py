import requests
import json

def get_player_info(player_id):
    # VLR Esports API endpoint
    api_url = f"http://localhost:5000/api/v1/players/{player_id}"
    
    # 设置请求头
    headers = {
        'User-Agent': 'ValorantPlayerLookup/1.0',
        'Accept': 'application/json'
    }
    
    try:
        # 发送 GET 请求
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()
        
        # 解析响应数据
        data = response.json()
        
        if not data or 'data' not in data:
            return None
            
        player_data = data['data']
        return {
            'info': {
                'vlrid': player_data.get('info', {}).get('id'),
                'gameid': player_data.get('info', {}).get('user'),
                'realname': player_data.get('info', {}).get('name'),
                'nationality': player_data.get('info', {}).get('country'),
                'flag': player_data.get('info', {}).get('flag'),
                'img': player_data.get('info', {}).get('img')
            },
            'team': {
                'teamid': player_data.get('team', {}).get('id'),
                'teamname': player_data.get('team', {}).get('name'),
                'teamlogo': player_data.get('team', {}).get('logo'),
                'joined': player_data.get('team', {}).get('joined')
            },
            'agents': player_data.get('agents', [])[:4]
        }
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

# def get_player_ext(player_id):
#     # VLR Esports API endpoint
#     api_url = f"http://localhost:5000/api/v1/players/{player_id}"
    
#     # 设置请求头
#     headers = {
#         'User-Agent': 'ValorantPlayerLookup/1.0',
#         'Accept': 'application/json'
#     }
    
#     try:
#         # 发送 GET 请求
#         response = requests.get(api_url, headers=headers)
#         response.raise_for_status()
        
#         # 解析响应数据
#         data = response.json()
        
#         if not data or 'data' not in data:
#             return None
            
#         player_data = data['data']
#         return {
#             'id': player_data.get('info').get('id'), # Player VLR ID
#             'user': player_data.get('info').get('user'), # In game ID
#             'name': player_data.get('info').get('name'), # Real name
#             'team': player_data.get('team').get('name'), # Team VLR name
#             'nationality': player_data.get('info').get('country'),
#             'agents': [agent.get('agentName') for agent in player_data.get('agents', [])[:4]]
#         }
        
#     except requests.exceptions.RequestException as e:
#         print(f"Error fetching data: {e}")
#         return None

# 使用示例
if __name__ == "__main__":
    import sys
    player_id = sys.argv[1]
    result = get_player_info(player_id)
    
    if result:
        # 将结果保存到 JSON 文件
        with open(f"player_{player_id}.txt.json", "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=4)
        print(f"Results saved to player_{player_id}.json")
    else:
        print("Player not found or error occurred")