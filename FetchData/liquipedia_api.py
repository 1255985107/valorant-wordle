import requests
import json
import re

def parse_team_and_agents(content):
    # 解析当前战队
    team_match = re.search(r'\|status=Active\n.*?\|history={{TeamHistoryAuto}}', content, re.DOTALL)
    current_team = "Unknown"
    if team_match:
        team_lines = team_match.group(0).split('\n')
        for line in team_lines:
            if '{{TeamIcon|' in line:
                current_team = line.split('{{TeamIcon|')[1].split('}')[0]
                break
    
    # 解析常用英雄（目前API中似乎没有直接提供这个信息）
    agents = []
    agent_match = re.search(r'==Statistics==.*?==', content, re.DOTALL)
    if agent_match:
        agent_section = agent_match.group(0)
        # 这里可以添加更多的解析逻辑来获取常用英雄
    
    return current_team, agents

def get_player_info(player_id):
    # Liquipedia API endpoint
    api_url = "https://liquipedia.net/valorant/api.php"
    
    # 设置请求头，包含用户代理信息
    headers = {
        'User-Agent': 'ValorantPlayerLookup/1.0 (jerryhzy@outlook.com)',
        'Accept-Encoding': 'gzip'
    }
    
    # 设置查询参数
    params = {
        'action': 'query',
        'format': 'json',
        'titles': player_id,
        'prop': 'info|revisions|pageprops',
        'rvprop': 'content',
    }
    
    try:
        # 发送 GET 请求
        response = requests.get(api_url, headers=headers, params=params)
        response.raise_for_status()
        
        # 解析响应数据
        data = response.json()
        
        # 获取页面内容
        pages = data.get('query', {}).get('pages', {})
        
        if not pages:
            return None
            
        # 获取第一个页面的信息
        page = next(iter(pages.values()))
        
        # 检查页面是否存在
        if 'missing' in page:
            return None
            
        content = page.get('revisions', [{}])[0].get('*', '') if page.get('revisions') else None
        current_team, agents = parse_team_and_agents(content) if content else (None, [])
            
        return {
            'pageid': page.get('pageid'),
            'title': page.get('title'),
            'content': content,
            'current_team': current_team,
            'main_agents': agents
        }
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

# 使用示例
if __name__ == "__main__":
    player_id = "xccurate"  # 示例选手ID
    result = get_player_info(player_id)
    
    if result:
        # 将结果保存到 JSON 文件
        with open(f"{player_id}.json", "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=4)
        print(result['content'] if result else "No content found")
        print(f"Results saved to {player_id}.json")
    else:
        print("Player not found or error occurred")